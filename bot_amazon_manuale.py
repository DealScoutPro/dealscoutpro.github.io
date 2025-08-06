import telegram
import asyncio
import math
import time
import requests
import re
import os
import json
import subprocess
from bs4 import BeautifulSoup
from PIL import Image, ImageOps
from io import BytesIO


# --- CONFIGURAZIONE ---
# Sostituisci "IL_TUO_TOKEN_TELEGRAM" con il tuo token
TELEGRAM_BOT_TOKEN = "8326914214:AAEv_KScR6Cp0OdOj_8b2sMr4wky9-haLck"
# Sostituisci "@NOME_DEL_TUO_CANALE" con l'username del tuo canale
CHANNEL_ID = "@DealScoutProAmazon"

# Credenziali di GitHub
github_token = os.getenv("GITHUB_TOKEN")
repo_url = f"https://{github_token}@github.com/DealScoutPro/dealscoutpro.github.io.git"
json_filename = 'data.json'

# Mappatura delle categorie con emoji e messaggi introduttivi
MESSAGGI_CATEGORIE = {
    "moda": "🛍️ **Moda e Stile **",
    "cucina": "🍳 **Utensili e accessori per la Cucina **",
    "ufficio": "💼 **Prodotti per l'Ufficio **",
    "casa": "🏠 **Offerte per la Casa e il Giardino **",
    "tech": "💡 **Occasione Tech **",
    "bellezza": "💄 **Offerta Beauty **",
    "intrattenimento": "🎬 **Offerta Intrattenimento **",
    "libri": "📚 **Letture imperdibili **",
    "sport": "👟 **Articoli Sportivi e Fitness **",
    "generico": "🔥 **Offerta Flash **"
}

# Dizionario di frasi dinamiche per gli sconti
FRASI_SCONTO = {
    10: "⭐ Un risparmio garantito superiore al {sconto}%.",
    20: "🎉 Ottimo sconto, oltre il {sconto}%.",
    30: "💰 Un vero affare, sconto superiore al {sconto}%!",
    40: "🔥 Prezzo super scontato, sconto superiore al {sconto}%!",
    50: "🤯 Metà prezzo, sconto superiore al {sconto}%!",
    70: "🚀 Prezzo al minimo storico, sconto superiore al {sconto}%!"
}

# Parole chiave da mantenere all'interno delle parentesi
PAROLE_CHIAVE_DA_MANTENERE = ['pezzi', 'set', 'taglia']

def get_frase_sconto(sconto_percentuale):
    """Restituisce una frase di sconto dinamica."""
    try:
        sconto_num = int(sconto_percentuale)
        if sconto_num > 0 and sconto_num < 10:
            scaglione = 10
        else:
            scaglione = math.ceil(sconto_num / 10) * 10
        frase_modello = FRASI_SCONTO.get(scaglione, "")
        return frase_modello.format(sconto=sconto_num)
    except (ValueError, TypeError):
        return ""

def pulisci_e_sintetizza_titolo(titolo):
    """Pulisce e sintetizza il titolo per una migliore leggibilità."""
    if not titolo:
        return "Offerta speciale"
    
    titolo_pulito = titolo
    for pattern in [r'\((.*?)\)', r'\[(.*?)\]']:
        matches = re.finditer(pattern, titolo_pulito)
        for match in matches:
            contenuto = match.group(1)
            if not any(keyword in contenuto.lower() for keyword in PAROLE_CHIAVE_DA_MANTENERE):
                titolo_pulito = titolo_pulito.replace(match.group(0), '')
    
    titolo_pulito = ' '.join(titolo_pulito.split())
    
    LIMITE_CARATTERI = 80
    if len(titolo_pulito) <= LIMITE_CARATTERI:
        return titolo_pulito
    else:
        titolo_sintetizzato = titolo_pulito[:LIMITE_CARATTERI]
        ultimo_spazio = titolo_sintetizzato.rfind(' ')
        if ultimo_spazio != -1:
            titolo_sintetizzato = titolo_sintetizzato[:ultimo_spazio]
        if titolo_sintetizzato and titolo_sintetizzato[-1] in ['.', ',', ';', ':', '!', '?']:
            titolo_sintetizzato = titolo_sintetizzato[:-1]
        return titolo_sintetizzato + '...'

def estrai_prezzo(soup):
    """Estrae il prezzo attuale del prodotto da una pagina Amazon."""
    prezzo = None
    try:
        prezzo_whole_element = soup.find('span', class_='a-price-whole')
        if prezzo_whole_element:
            prezzo_whole_text = prezzo_whole_element.text.strip().replace('.', '')
            prezzo_fraction_element = soup.find('span', class_='a-price-fraction')
            prezzo_fraction_text = prezzo_fraction_element.text.strip() if prezzo_fraction_element else '00'
            prezzo = float(f"{prezzo_whole_text.replace(',', '')}.{prezzo_fraction_text}")
        if not prezzo:
            priceblock_ourprice_element = soup.find('span', {'id': 'priceblock_ourprice'})
            if priceblock_ourprice_element:
                prezzo_testo = priceblock_ourprice_element.text.strip().replace('€', '').replace(',', '.').replace(' ', '')
                prezzo = float(prezzo_testo)
        if not prezzo:
            dealprice_element = soup.find('span', {'id': 'priceblock_dealprice'})
            if dealprice_element:
                prezzo_testo = dealprice_element.text.strip().replace('€', '').replace(',', '.').replace(' ', '')
                prezzo = float(prezzo_testo)
    except (AttributeError, ValueError):
        pass
    return prezzo

def estrai_prezzo_vecchio(soup):
    """Estrae il prezzo di listino (prezzo barrato) del prodotto."""
    prezzo_vecchio = None
    try:
        prezzo_vecchio_element = soup.find('span', class_='a-price a-text-price')
        if prezzo_vecchio_element:
            prezzo_vecchio_testo = prezzo_vecchio_element.find('span', class_='a-offscreen').text.strip()
            prezzo_vecchio_testo = prezzo_vecchio_testo.replace('€', '').replace(',', '.').replace(' ', '')
            prezzo_vecchio = float(prezzo_vecchio_testo)
        if not prezzo_vecchio:
            prezzo_vecchio_element_alt = soup.find('span', class_='a-text-strike')
            if prezzo_vecchio_element_alt:
                prezzo_vecchio_testo = prezzo_vecchio_element_alt.text.strip().replace('€', '').replace(',', '.').replace(' ', '')
                prezzo_vecchio = float(prezzo_vecchio_testo)
    except (AttributeError, ValueError):
        pass
    return prezzo_vecchio

def ottieni_dati_da_amazon(url):
    """Estrae titolo, URL immagine, prezzo e sconto da un link Amazon."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        url_immagine_element = soup.find('img', {'id': 'landingImage'})
        url_immagine = None
        if url_immagine_element and 'data-a-dynamic-image' in url_immagine_element.attrs:
            import json
            dynamic_images = json.loads(url_immagine_element['data-a-dynamic-image'])
            url_immagine = max(dynamic_images, key=lambda url: dynamic_images[url][0])
        elif url_immagine_element and 'src' in url_immagine_element.attrs:
            url_immagine = url_immagine_element['src']
        
        titolo_html = soup.find('span', {'id': 'productTitle'})
        titolo = titolo_html.text.strip() if titolo_html else "Offerta speciale"
        
        prezzo_attuale = estrai_prezzo(soup)
        prezzo_vecchio = estrai_prezzo_vecchio(soup)
        
        sconto_percentuale = None
        if prezzo_attuale and prezzo_vecchio and prezzo_vecchio > prezzo_attuale:
            sconto_percentuale = round((1 - (prezzo_attuale / prezzo_vecchio)) * 100)
            
        return {
            'title': titolo,
            'image': url_immagine,
            'price': prezzo_attuale,
            'discount': sconto_percentuale,
            'link': url
        }
    except requests.exceptions.RequestException as e:
        print(f"Errore nella richiesta HTTP: {e}")
        return None
    except Exception as e:
        print(f"Errore durante l'estrazione dei dati: {e}")
        return None

async def ridimensiona_e_ottiene_immagine(url_immagine):
    """
    Scarica un'immagine e la adatta a un riquadro 4:3 di 1000x750 pixel.
    """
    if not url_immagine:
        return None
        
    try:
        response = requests.get(url_immagine)
        response.raise_for_status()
        immagine_originale = Image.open(BytesIO(response.content))
        
        DIMENSIONE_RETTANGOLO = (1000, 750)
        immagine_rettangolare = ImageOps.pad(immagine_originale, DIMENSIONE_RETTANGOLO, color='white')
        
        buffer = BytesIO()
        immagine_rettangolare.save(buffer, format='JPEG', quality=95)
        buffer.seek(0)
        
        return buffer
    
    except Exception as e:
        print(f"Errore durante la gestione dell'immagine: {e}")
        return None

def aggiorna_e_sincronizza_json(new_offer_data):
    """Aggiunge una nuova offerta al file JSON e sincronizza con GitHub."""
    offers = []

    if os.path.exists(json_filename):
        with open(json_filename, 'r', encoding='utf-8') as f:
            try:
                offers = json.load(f)
            except json.JSONDecodeError:
                offers = []

    offers.insert(0, new_offer_data)

    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(offers, f, ensure_ascii=False, indent=4)

    print(f"Offerta aggiunta a {json_filename} con successo.")

    # --- INIZIO PARTE DI SINCRONIZZAZIONE GITHUB ---
    try:
        # Percorso esplicito della cartella del tuo progetto
        repo_dir = 'd:/Users/Ale/Desktop/BOT AMAZON/'

        # Imposta l'URL remoto per l'autenticazione
        subprocess.run(['git', 'remote', 'set-url', 'origin', repo_url], cwd=repo_dir, check=True)

        # Aggiunge esplicitamente il file data.json per il commit
        subprocess.run(['git', 'add', json_filename], cwd=repo_dir, check=True)
        print("File data.json aggiunto con successo al tracciamento di Git.")

        # Verifica se ci sono modifiche da committare
        output = subprocess.run(['git', 'status', '--porcelain'], cwd=repo_dir, capture_output=True, text=True, check=True).stdout
        if output:
            # Commina le modifiche
            subprocess.run(['git', 'commit', '-m', 'Aggiornamento automatico offerte'], cwd=repo_dir, check=True)
            print("Commit creato con successo.")

            # Effettua il push delle modifiche
            subprocess.run(['git', 'push', 'origin', 'main'], cwd=repo_dir, check=True)
            print("Sincronizzazione su GitHub completata con successo!")
        else:
            print("Nessuna modifica da sincronizzare.")

    except subprocess.CalledProcessError as e:
        print(f"Errore durante l'operazione Git: {e}")
        print(f"Output di errore: {e.stderr}")
    # --- FINE PARTE DI SINCRONIZZAZIONE GITHUB ---

async def invia_offerta_telegram(url, categoria, offer_data):
    """
    Invia un'offerta su Telegram con immagine, didascalia e pulsante.
    """
    bot = telegram.Bot(token=TELEGRAM_BOT_TOKEN)
    
    titolo_originale = offer_data['title']
    url_immagine = offer_data['image']
    prezzo_estratto = offer_data['price']
    sconto_estratto = offer_data['discount']
    
    if not prezzo_estratto or sconto_estratto is None:
        print("Impossibile estrarre prezzo o sconto. Richiesta inserimento manuale.")
        prezzo_input = input("Inserisci il prezzo (es. 190,90): ")
        sconto_input = input("Inserisci la percentuale di sconto numerica (es. 20). Lascia vuoto se non c'è: ")
        
        try:
            prezzo_estratto = float(prezzo_input.replace(',', '.'))
            sconto_estratto = int(sconto_input) if sconto_input else None
        except (ValueError, TypeError):
            print("Input non valido. Si prega di riprovare.")
            return

    titolo = pulisci_e_sintetizza_titolo(titolo_originale)
    
    if url and prezzo_estratto:
        intro_messaggio = MESSAGGI_CATEGORIE.get(categoria.lower(), MESSAGGI_CATEGORIE["generico"])
        prezzo_formattato = f"{prezzo_estratto:.2f}".replace('.', ',')
        dettagli_prezzo = f"💸 **Prezzo: {prezzo_formattato} €**"
        frase_sconto = ""
        
        if sconto_estratto and isinstance(sconto_estratto, (int, float)):
            dettagli_prezzo += f" (-{sconto_estratto}%)"
            frase_sconto = get_frase_sconto(sconto_estratto)

        tag_categoria = f"#{categoria.lower().replace(' ', '_')}"

        didascalia = (
            f"{intro_messaggio}\n\n"
            f"**{titolo}**\n\n"
            f"{dettagli_prezzo}\n\n"
            f"{frase_sconto}\n\n"
            f"🔗 [Link prodotto]({url})\n\n"
            f"{tag_categoria}"
        )
        
        keyboard = [
            [telegram.InlineKeyboardButton("Vai all'offerta", url=url)],
        ]
        reply_markup = telegram.InlineKeyboardMarkup(keyboard)

        immagine_buffer = await ridimensiona_e_ottiene_immagine(url_immagine)
        
        if immagine_buffer:
            await bot.send_photo(
                chat_id=CHANNEL_ID,
                photo=immagine_buffer,
                caption=didascalia,
                parse_mode="Markdown",
                reply_markup=reply_markup
            )
            print(f"Offerta inviata con immagine (Categoria: {categoria}): {titolo}")
        else:
            await bot.send_message(
                chat_id=CHANNEL_ID,
                text=didascalia,
                parse_mode="Markdown",
                disable_web_page_preview=True,
                reply_markup=reply_markup
            )
            print(f"Offerta inviata senza immagine (fall-back) (Categoria: {categoria}): {titolo}")
            
    else:
        print("Errore: URL o prezzo mancanti.")

async def main():
    while True:
        url_affiliato = input("Inserisci il link di affiliazione Amazon (o 'quit' per uscire): ")
        if url_affiliato.lower() == 'quit':
            break
        
        categoria_prodotto = input("Inserisci la categoria del prodotto (es. tech, moda, cucina, ufficio, ecc.): ")
        
        print("Scraping e aggiornamento in corso...")
        offer_data = ottieni_dati_da_amazon(url_affiliato)
        
        if offer_data and offer_data['link']:
            print("Dati estratti con successo.")
            
            await invia_offerta_telegram(url_affiliato, categoria_prodotto, offer_data)
            aggiorna_e_sincronizza_json(offer_data)
        else:
            print("Fallito l'estrazione dei dati. L'offerta non verrà elaborata.")
            
        print("-" * 50)
        input("Operazione completata. Premi Invio per continuare...")

if __name__ == "__main__":
    asyncio.run(main())