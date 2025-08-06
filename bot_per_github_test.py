from telethon import TelegramClient
import json
import re
import os

# Credenziali API (SOSTITUISCI CON LE TUE)
api_id = 22650611
api_hash = '12e4e847881d209c618b307b3dcb1b0e'
channel_username = 'https://t.me/DealScoutProAmazon'

# Inizializza il client di Telegram
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
    
    # Estrazione del link
    if message.entities:
        for entity in message.entities:
            if type(entity).__name__ == 'MessageEntityTextUrl':
                data['link'] = entity.url
                break
    
    # Se non c'è un link, non è un'offerta valida
    if not data['link']:
        return data

    # Estrazione dell'immagine
    if message.photo:
        data['image'] = 'path/placeholder.jpg'  # Useremo un segnaposto per ora

    # Estrazione del testo (titolo, prezzo, sconto)
    text = message.text.replace(data['link'], '').strip()

    # Cerchiamo il prezzo (con il simbolo €)
    price_match = re.search(r'(\d+,\d{2})\s?€', text)
    if price_match:
        data['price'] = price_match.group(1) + ' €'
    
    # Cerchiamo lo sconto (in formato -XX%)
    discount_match = re.search(r'-(\d+)%', text)
    if discount_match:
        data['discount'] = f"-{discount_match.group(1)}%"

    # Rimuoviamo prezzo e sconto per isolare il titolo
    if data['price']:
        text = text.replace(data['price'].replace(' ', ''), '').strip()
    if data['discount']:
        text = text.replace(data['discount'], '').strip()
    
    # Ciò che rimane è il titolo, troncato a 100 caratteri per evitare testi troppo lunghi
    data['title'] = text.strip()[:100] + '...' if len(text.strip()) > 100 else text.strip()

    return data

# Funzione per generare il file JSON
async def generate_json():
    offers = []
    
    async for message in client.iter_messages(channel_username, limit=50):
        if not message.text:
            continue

        offer = extract_offer_data(message)
        
        if offer['link']:
            offers.append(offer)

    # Costruisci il percorso assoluto per il file data.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'data.json')

    # Salva i dati in un file JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(offers, f, ensure_ascii=False, indent=4)
    
    print(f'File data.json generato con successo in: {json_path}')

# Avvia la generazione del file JSON
async def main():
    await client.start()
    await generate_json()
    await client.run_until_disconnected()

if __name__ == '__main__':
    with client:
        client.loop.run_until_complete(main())