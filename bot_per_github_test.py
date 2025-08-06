from telethon import TelegramClient
import json
import re
import os
from git import Repo

# Credenziali API Telegram (caricate da segreti GitHub)
api_id = os.environ.get('API_ID')
api_hash = os.environ.get('API_HASH')
channel_username = os.environ.get('CHANNEL_USERNAME')

# Credenziali GitHub (caricate da segreti GitHub)
github_token = os.environ.get('GH_TOKEN')

# Inizializza il client di Telegram
# Aggiunto 'session' e 'test' per l'autenticazione non interattiva
client = TelegramClient('deal_bot', api_id, api_hash)

# Funzione per estrarre i dati da un messaggio
def extract_offer_data(message):
    data = {
        'title': None,
        'image': None,
        'price': None,
        'discount': None,
        'link': None
    }
    
    if message.entities:
        for entity in message.entities:
            if type(entity).__name__ == 'MessageEntityTextUrl':
                data['link'] = entity.url
                break
    
    if not data['link']:
        return data

    if message.photo:
        data['image'] = 'placeholder.jpg'

    text = message.text.replace(data['link'], '').strip()

    price_match = re.search(r'(\d+,\d{2})\s?€', text)
    if price_match:
        data['price'] = price_match.group(1) + ' €'
    
    discount_match = re.search(r'-(\d+)%', text)
    if discount_match:
        data['discount'] = f"-{discount_match.group(1)}%"
    
    if data['price']:
        text = text.replace(data['price'].replace(' ', ''), '').strip()
    if data['discount']:
        text = text.replace(data['discount'], '').strip()

    data['title'] = text.strip()[:100] + '...' if len(text.strip()) > 100 else text.strip()

    return data

# Funzione per generare e sincronizzare il file JSON
async def generate_and_sync_json():
    offers = []
    
    # Questo è un modo migliore per gestire il client
    async with client:
        # Recupera il canale
        channel = await client.get_entity(channel_username)
        
        async for message in client.iter_messages(channel, limit=50):
            if not message.text:
                continue
            offer = extract_offer_data(message)
            if offer['link']:
                offers.append(offer)

    json_path = os.path.join(os.getcwd(), 'data.json')

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(offers, f, ensure_ascii=False, indent=4)
    
    print(f'File data.json generato con successo in: {json_path}')

    try:
        repo = Repo('.')
        repo.index.add(['data.json'])
        
        if repo.index.diff("HEAD"):
            repo.index.commit("Aggiornamento offerte automatico")
            
            origin = repo.remote(name='origin')
            origin_url = origin.url.replace('https://', f'https://x-access-token:{github_token}@')
            
            with origin.config_writer as cw:
                cw.set('url', origin_url)
            
            origin.push()
            print("Sincronizzazione su GitHub completata con successo!")
        else:
            print("Nessuna modifica da sincronizzare.")

    except Exception as e:
        print(f"Errore durante la sincronizzazione su GitHub: {e}")

# Avvia la generazione del file JSON
async def main():
    await generate_and_sync_json()

if __name__ == '__main__':
    with client:
        client.loop.run_until_complete(main())
