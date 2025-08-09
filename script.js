document.addEventListener('DOMContentLoaded', () => {
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    const filterBtn = document.getElementById('filter-btn');
    const sortBtn = document.getElementById('sort-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const sortDropdown = document.getElementById('sort-dropdown');
    const filterCheckboxes = document.querySelectorAll('.checkbox-option input');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const offersGrid = document.getElementById('offers-grid');
    const searchInput = document.getElementById('search-input');
    const pwaInstallButton = document.getElementById('pwa-install-button');
    let deferredPrompt;
    let allOffers = [];

    // Struttura dati fissa
    const offersData = [
        {
            "title": "Xiaomi Robot Vacuum S20, Robot Aspirapolvere Lavapavimenti, Aspirazione 5.000 Pa, Sistema Navigazione laser LDS, Ampio contenitore della Polvere e Serbatorio dell'Acqua, Controllo Vocale e App",
            "image": "https://m.media-amazon.com/images/I/71215Q1O34L._AC_SX679_.jpg",
            "price": 156.99,
            "discount": 8,
            "link": "https://amzn.to/45iCp4d"
        },
        {
            "title": "Pistola Massaggio Muscolare con Testa Calda e Fredda, RENPHO Massaggiatore Muscolare Portatile fino a 3200rpm, Pistola Massaggiante Professionale Silenziosa, 5 Testa 5 Velocità, Ricarica di Tipo C",
            "image": "https://m.media-amazon.com/images/I/61YZQrGrVbL._AC_SX679_.jpg",
            "price": 96.51,
            "discount": 31,
            "link": "https://amzn.to/3Uhldas"
        },
        {
            "title": "SONGMICS Sedia da Ufficio Girevole, Altezza Regolabile, Poltrona da Gaming, Sedia da Computer, con Meccanismo di Inclinazione, Nero OBG56B",
            "image": "https://m.media-amazon.com/images/I/71lkcaY+pbL._AC_SX679_.jpg",
            "price": 89.99,
            "discount": 22,
            "link": "https://amzn.to/3JkaJoa"
        },
        {
            "title": "SONGMICS Sedia da Ufficio, Sedia a Rete Girevole, Altezza e Poggiapiedi Regolabili, Ergonomica, con Braccioli, Capacità di Carico 120 kg, Nero OBN25BK",
            "image": "https://m.media-amazon.com/images/I/71IfLhPJbYL._AC_SX679_.jpg",
            "price": 99.99,
            "discount": 23,
            "link": "https://amzn.to/3UgOG48"
        },
        {
            "title": "Lagostina Ingenio Mineralis Eco Set Padelle Antiaderenti in Alluminio 100% Riciclato, Adatto all’Induzione, 10 Pezzi, Casseruola 16cm, Padella 28cm, Tegame 24cm, Wok 26cm, 5 Coperchi e Manico",
            "image": "https://m.media-amazon.com/images/I/61uW8QaRf8L._AC_SX679_.jpg",
            "price": 175.5,
            "discount": 12,
            "link": "https://amzn.to/46LSge2"
        },
        {
            "title": "Vans - Copy of Old Skool Platform Cuadros VN0A3B3UHRK1",
            "image": "https://m.media-amazon.com/images/I/51Reh8IDlRL._AC_SX695_.jpg",
            "price": 61.99,
            "discount": 17,
            "link": "https://amzn.to/459Lo9i"
        },
        {
            "title": "Pinko Love Classic Puff Cl Sheep Nap, Borsa Donna, Taglia Unica",
            "image": "https://m.media-amazon.com/images/I/61CiOZBnPLL._AC_SY695_.jpg",
            "price": 271.0,
            "discount": 30,
            "link": "https://amzn.to/455Adyd"
        },
        {
            "title": "adidas Hoops 3.0 Low Classic Vintage Shoes, Sneakers Uomo",
            "image": "https://m.media-amazon.com/images/I/41jojxoUiZL._AC_SY695_.jpg",
            "price": 43.9,
            "discount": 32,
            "link": "https://amzn.to/45E9o4j"
        },
        {
            "title": "Philips Airfryer Serie 2000 - Friggitrice ad aria da 4,2L, 1500W, Tecnologia RapidAir, Touchscreen digitale, 13 modalità, 9 funzioni preimpostate, Fino al 90% di grassi in meno, Nero (NA229/00)",
            "image": "https://m.media-amazon.com/images/I/51EJtxG4ZqL._AC_SX679_.jpg",
            "price": 69.99,
            "discount": 22,
            "link": "https://amzn.to/4onvoHZ"
        },
        {
            "title": "Krups Nespresso Inissia XN1005, Macchina da caffè, Sistema Capsule Nespresso, Serbatoio acqua 0.7L, Ruby Red",
            "image": "https://m.media-amazon.com/images/I/51rVe9bPc-L._AC_SY879_.jpg",
            "price": 79.0,
            "discount": 34,
            "link": "https://amzn.to/3Ud0d4y"
        },
        {
            "title": "Xiaomi Smart Band 9 Active, Schermo TFT 1.47\", Monitoraggio Salute: SpO2, Frequenza Cardiaca, Sonno e Stress, 50 modalità sportive, Resistenza Acqua 5 ATM, Durata Batteria 18 giorni, Nero",
            "image": "https://m.media-amazon.com/images/I/61OhQCN2QFL._AC_SX679_.jpg",
            "price": 20.99,
            "discount": 22,
            "link": "https://amzn.to/4lqFrtu"
        }
    ];

    // Funzione per calcolare il prezzo vecchio e la classe di sconto
    const preprocessOffers = (offers) => {
        return offers.map(offer => {
            const oldPrice = offer.price / (1 - offer.discount / 100);
            let discountClass = '';
            if (offer.discount >= 50) discountClass = 'blue-discount';
            else if (offer.discount >= 30) discountClass = 'green-discount';
            else if (offer.discount >= 20) discountClass = 'orange-discount';
            else if (offer.discount >= 10) discountClass = 'red-discount';
            else discountClass = 'grey-discount';

            return {
                ...offer,
                oldPrice: oldPrice.toFixed(2),
                discountClass: discountClass
            };
        });
    };

    allOffers = preprocessOffers(offersData);

    // Gestione dell'installazione PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        pwaInstallButton.style.display = 'block';
    });

    pwaInstallButton.addEventListener('click', () => {
        if (deferredPrompt) {
            const confirmed = window.confirm("Vuoi installare DealScoutPro sul tuo dispositivo?");
            if (confirmed) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                    } else {
                        console.log('User dismissed the A2HS prompt');
                    }
                    deferredPrompt = null;
                });
            }
        }
    });

    // Funzione per renderizzare le offerte sulla pagina
    const renderOffers = (offersToRender) => {
        offersGrid.innerHTML = offersToRender.map(offer => `
            <article class="offer-card" data-price="${offer.price}" data-discount="${offer.discount}">
                <div class="card-image-container">
                    <img src="${offer.image}" alt="${offer.title}">
                    <span class="discount-badge ${offer.discountClass}">-${offer.discount}%</span>
                </div>
                <div class="card-content-wrapper">
                    <div class="card-content">
                        <h4>${offer.title}</h4>
                        <div class="bottom-row">
                            <div class="price-container">
                                <span class="current-price">${offer.price.toFixed(2)}€</span>
                                <span class="old-price">${offer.oldPrice}€</span>
                            </div>
                            <a href="${offer.link}" class="cta-button" target="_blank"></a>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');
    };

    // Funzione per filtrare le offerte
    const filterOffers = () => {
        const activeFilters = Array.from(filterCheckboxes).filter(cb => cb.checked && cb.id !== 'filter-all').map(cb => cb.dataset.filter);
        const searchTerm = searchInput.value.toLowerCase().trim();

        let filteredOffers = allOffers.filter(offer => {
            const matchesSearch = offer.title.toLowerCase().includes(searchTerm);
            
            if (activeFilters.length === 0 || document.getElementById('filter-all').checked) {
                return matchesSearch;
            }

            const matchesFilter = activeFilters.some(filter => {
                const discountValue = parseInt(filter.replace('discount-', ''), 10);
                return offer.discount >= discountValue;
            });

            return matchesSearch && matchesFilter;
        });
        
        const activeSort = document.querySelector('.sort-option.active');
        if (activeSort) {
            sortOffers(filteredOffers, activeSort.dataset.sortBy, activeSort.dataset.sortOrder);
        } else {
            renderOffers(filteredOffers);
        }
    };

    // Funzione per ordinare le offerte
    const sortOffers = (offersToSort, sortBy, sortOrder) => {
        let sortedOffers = [...offersToSort];

        if (sortBy === 'price') {
            sortedOffers.sort((a, b) => {
                if (sortOrder === 'asc') return a.price - b.price;
                return b.price - a.price;
            });
        } else if (sortBy === 'discount') {
            sortedOffers.sort((a, b) => b.discount - a.discount);
        }

        renderOffers(sortedOffers);
    };

    // Gestione filtri
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.id === 'filter-all') {
                filterCheckboxes.forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
            } else if (checkbox.checked) {
                document.getElementById('filter-all').checked = false;
            }
            const anyOtherChecked = Array.from(filterCheckboxes).some(cb => cb.checked && cb.id !== 'filter-all');
            if (!anyOtherChecked) {
                document.getElementById('filter-all').checked = true;
            }
            filterOffers();
        });
    });

    clearFiltersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        filterCheckboxes.forEach(cb => cb.checked = false);
        document.getElementById('filter-all').checked = true;
        filterOffers();
    });

    // Gestione ordinamento
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            filterOffers();
        });
    });

    // Gestione ricerca
    searchInput.addEventListener('input', filterOffers);

    // Gestione Night Mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        if (savedTheme === 'night-mode') {
            themeSwitch.checked = true;
        }
    }

    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            document.body.classList.add('night-mode');
            localStorage.setItem('theme', 'night-mode');
        } else {
            document.body.classList.remove('night-mode');
            localStorage.setItem('theme', 'day-mode');
        }
    });

    // Gestione dropdown
    document.addEventListener('click', (e) => {
        if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
            filterDropdown.classList.remove('show');
        }
        if (!sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.classList.remove('show');
        }
    });

    filterBtn.addEventListener('click', () => {
        filterDropdown.classList.toggle('show');
        sortDropdown.classList.remove('show');
    });

    sortBtn.addEventListener('click', () => {
        sortDropdown.classList.toggle('show');
        filterDropdown.classList.remove('show');
    });

    renderOffers(allOffers);
});