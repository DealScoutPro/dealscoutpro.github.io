document.addEventListener('DOMContentLoaded', () => {
    const offersContainer = document.getElementById('offers-container');
    const searchInput = document.getElementById('search-input');
    const filterDropdown = document.getElementById('filter-dropdown');
    let offersData = [];

    // Funzione per caricare i dati dal file JSON
    async function fetchOffers() {
        try {
            const response = await fetch('data.json');
            offersData = await response.json();
            displayOffers(offersData);
            populateFilters();
        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
            offersContainer.innerHTML = '<p>Errore nel caricamento delle offerte. Riprova più tardi.</p>';
        }
    }

    // Funzione per visualizzare le offerte
    function displayOffers(offers) {
        offersContainer.innerHTML = '';
        offers.forEach(offer => {
            const offerCard = document.createElement('div');
            offerCard.className = 'offer-card';

            offerCard.innerHTML = `
                <div class="image-container">
                    <img src="${offer.url_immagine}" alt="${offer.titolo}">
                </div>
                <div class="card-content">
                    <h2 class="offer-title">${offer.titolo}</h2>
                    <p class="offer-price">€${offer.prezzo.toFixed(2).replace('.', ',')}</p>
                    <p class="offer-discount">${offer.sconto_percentuale}% di sconto</p>
                    <a href="${offer.link_affiliazione}" class="offer-button" target="_blank">Vedi l'offerta</a>
                </div>
            `;
            offersContainer.appendChild(offerCard);
        });
    }

    // Funzione per popolare i filtri in base alle categorie uniche
    function populateFilters() {
        const categories = [...new Set(offersData.map(offer => offer.categoria))];
        filterDropdown.innerHTML = '';
        categories.forEach(cat => {
            const filterLink = document.createElement('a');
            filterLink.href = '#';
            filterLink.innerText = cat;
            filterLink.addEventListener('click', (e) => {
                e.preventDefault();
                const filteredOffers = offersData.filter(offer => offer.categoria === cat);
                displayOffers(filteredOffers);
            });
            filterDropdown.appendChild(filterLink);
        });
    }

    // Logica per il pulsante di ricerca
    searchInput.addEventListener('keyup', (e) => {
        const searchText = e.target.value.toLowerCase();
        const filteredOffers = offersData.filter(offer => offer.titolo.toLowerCase().includes(searchText));
        displayOffers(filteredOffers);
    });

    // Avvia il caricamento delle offerte all'inizio
    fetchOffers();
});
