document.addEventListener('DOMContentLoaded', () => {
    const offersContainer = document.getElementById('offers-container');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const filterButton = document.getElementById('filter-button');
    const filterDropdown = document.getElementById('filter-dropdown');
    let allOffers = [];
    let uniqueCategories = new Set();

    const renderOffers = (offers) => {
        offersContainer.innerHTML = '';
        if (offers.length === 0) {
            offersContainer.innerHTML = '<p class="text-center">Nessuna offerta disponibile al momento.</p>';
        } else {
            offers.forEach(offer => {
                const offerCard = document.createElement('div');
                offerCard.className = 'offer-card';
                offerCard.innerHTML = `
                    <div class="card-image-container">
                        <img src="${offer.image}" alt="${offer.title}">
                    </div>
                    <div class="card-content">
                        <h4>${offer.title}</h4>
                        <p class="price">Prezzo: €${offer.price.toFixed(2).replace('.', ',')}</p>
                        <p class="discount">Sconto: -${offer.discount}%</p>
                        <a href="${offer.link}" class="cta-button" target="_blank">Vai all'offerta</a>
                    </div>
                `;
                offersContainer.appendChild(offerCard);
            });
        }
    };

    const filterOffers = (category) => {
        const filteredOffers = allOffers.filter(offer => offer.category.toLowerCase() === category.toLowerCase());
        renderOffers(filteredOffers);
    };

    const createFilterDropdown = () => {
        filterDropdown.innerHTML = '';
        uniqueCategories.forEach(category => {
            const filterItem = document.createElement('a');
            filterItem.href = "#";
            filterItem.className = "dropdown-item";
            filterItem.textContent = category;
            filterItem.addEventListener('click', (e) => {
                e.preventDefault();
                filterOffers(category);
                filterDropdown.style.display = "none";
            });
            filterDropdown.appendChild(filterItem);
        });
        // Aggiungi un'opzione per mostrare tutte le offerte
        const allItem = document.createElement('a');
        allItem.href = "#";
        allItem.className = "dropdown-item";
        allItem.textContent = "Tutte le offerte";
        allItem.addEventListener('click', (e) => {
            e.preventDefault();
            renderOffers(allOffers);
            filterDropdown.style.display = "none";
        });
        filterDropdown.appendChild(allItem);
    };

    filterButton.addEventListener('click', () => {
        filterDropdown.style.display = filterDropdown.style.display === 'block' ? 'none' : 'block';
    });

    searchButton.addEventListener('click', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredOffers = allOffers.filter(offer => offer.title.toLowerCase().includes(searchTerm));
        renderOffers(filteredOffers);
    });

    // Funzione principale che carica i dati
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore di rete o file non trovato');
            }
            return response.json();
        })
        .then(data => {
            allOffers = data;
            data.forEach(offer => {
                // Aggiungi un campo categoria fittizio per il filtraggio
                // Se lo script Python non lo aggiunge, possiamo usare una categoria di default
                if (!offer.category) {
                    offer.category = "Generico";
                }
                uniqueCategories.add(offer.category);
            });
            renderOffers(allOffers);
            createFilterDropdown();
        })
        .catch(error => {
            console.error('Errore nel caricamento delle offerte:', error);
            offersContainer.innerHTML = `<p class="text-center text-danger">Errore nel caricamento delle offerte. Riprova più tardi.</p>`;
        });
});
