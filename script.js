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

    // Registrazione del Service Worker per il funzionamento PWA e offline
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registrato con successo:', registration);
                })
                .catch(error => {
                    console.log('Registrazione Service Worker fallita:', error);
                });
        });
    }

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

    // Gestione espansione titolo al click
    offersGrid.addEventListener('click', (e) => {
        const titleElement = e.target.closest('.offer-card h4');
        if (titleElement) {
            const card = titleElement.closest('.offer-card');
            card.classList.toggle('expanded');
        }
    });

    // Carica i dati da data.json e inizializza il sito
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            allOffers = preprocessOffers(data);
            renderOffers(allOffers);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
});