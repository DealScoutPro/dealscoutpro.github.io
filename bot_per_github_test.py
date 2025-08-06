from telethon import TelegramClient
import json
import re
import os
from git import Repo

# Credenziali del bot e dell'app (caricate da segreti GitHub)
telegram_bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
channel_username = os.environ.get('CHANNEL_USERNAME')

# Nuovi segreti da aggiungere su GitHub
telegram_api_id = os.environ.get('TELEGRAM_API_ID')
telegram_api_hash = os.environ.get('TELEGRAM_API_HASH')

# Credenziali GitHub (caricate da segreti GitHub)
github_token = os.environ.get('GH_TOKEN')

# Inizializza il client di Telegram con l'API ID e l'API Hash
client = TelegramClient('deal_bot_session', telegram_api_id, telegram_api_hash)

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
    
    # Autenticazione esplicita in modalità bot con il token
    await client.start(bot_token=telegram_bot_token)
    
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
    client.loop.run_until_complete(main())
