document.addEventListener('DOMContentLoaded', () => {
    // Logica esistente per la gestione delle offerte
    const offersGrid = document.getElementById('offersGrid');
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');
    const filterButton = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const sortButton = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');
    const clearFiltersButton = document.getElementById('clearFilters');
    let allOffers = [];

    const getDiscountColorClass = (discount) => {
        if (discount >= 50) return 'red-discount';
        if (discount >= 30) return 'green-discount';
        if (discount >= 20) return 'blue-discount';
        if (discount >= 10) return 'orange-discount';
        if (discount > 0) return 'grey-discount';
        return '';
    };

    const fetchOffers = async () => {
        try {
            const response = await fetch('data.json');
            allOffers = await response.json();
            filterAndSortOffers();
        } catch (error) {
            console.error('Errore nel caricamento delle offerte:', error);
            if (offersGrid) {
                offersGrid.innerHTML = '<p>Errore nel caricamento delle offerte.</p>';
            }
        }
    };

    const createOfferCard = (offer) => {
        const oldPrice = (offer.price / (1 - (offer.discount / 100))).toFixed(2);
        const discountColorClass = getDiscountColorClass(offer.discount);

        const card = document.createElement('article');
        card.classList.add('offer-card');
        card.innerHTML = `
            <div class="card-image-container">
                <img src="${offer.image}" alt="${offer.title}">
                <span class="discount-badge ${discountColorClass}">${offer.discount}%</span>
            </div>
            <div class="card-content-wrapper">
                <div class="card-content">
                    <h4>${offer.title}</h4>
                </div>
                <div class="bottom-row">
                    <div class="price-container">
                        <span class="current-price">€${offer.price.toFixed(2)}</span>
                        <span class="old-price">€${oldPrice}</span>
                    </div>
                    <a href="${offer.link}" class="cta-button"></a>
                </div>
            </div>
        `;
        return card;
    };

    const displayOffers = (offers) => {
        if (offersGrid) {
            offersGrid.innerHTML = '';
            if (offers.length === 0) {
                offersGrid.innerHTML = '<p>Nessuna offerta trovata.</p>';
                return;
            }
            offers.forEach(offer => offersGrid.appendChild(createOfferCard(offer)));
        }
    };

    const filterAndSortOffers = () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        const selectedFilters = Array.from(document.querySelectorAll('.filter-option input:checked')).map(input => input.dataset.filter);
        const sortByElement = document.querySelector('.sort-option.active');
        const sortBy = sortByElement ? sortByElement.dataset.sortBy : 'default';
        const sortOrder = sortByElement ? sortByElement.dataset.sortOrder : 'desc';

        let filtered = allOffers.filter(offer => {
            const matchesSearch = offer.title.toLowerCase().includes(searchTerm);
            
            if (selectedFilters.includes('all') || selectedFilters.length === 0) {
                return matchesSearch;
            }

            let matchesFilters = false;
            for (const filter of selectedFilters) {
                if (filter === 'discount-50' && offer.discount >= 50) matchesFilters = true;
                if (filter === 'discount-30' && offer.discount >= 30) matchesFilters = true;
                if (filter === 'discount-20' && offer.discount >= 20) matchesFilters = true;
                if (filter === 'discount-10' && offer.discount >= 10) matchesFilters = true;
            }
            return matchesSearch && matchesFilters;
        });
        
        if (sortBy !== 'default') {
            filtered.sort((a, b) => {
                let valA = a[sortBy];
                let valB = b[sortBy];

                if (sortOrder === 'asc') return valA - valB;
                return valB - valA;
            });
        }
        displayOffers(filtered);
    };

    const toggleDropdown = (dropdown) => {
        if (!dropdown) return;
        const isVisible = dropdown.classList.contains('show');
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
        if (!isVisible) {
            dropdown.classList.add('show');
        }
    };

    if (filterButton && filterDropdown) {
        filterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(filterDropdown);
        });
    }
    
    if (sortButton && sortDropdown) {
        sortButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(sortDropdown);
        });
    }

    document.addEventListener('click', (e) => {
        const isInsideDropdown = (filterButton && filterButton.contains(e.target)) ||
                                 (sortButton && sortButton.contains(e.target)) ||
                                 (filterDropdown && filterDropdown.contains(e.target)) ||
                                 (sortDropdown && sortDropdown.contains(e.target));
        if (!isInsideDropdown) {
            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
        }
    });

    document.querySelectorAll('.checkbox-option input').forEach(input => {
        input.addEventListener('change', (e) => {
            const filterAllInput = document.getElementById('filter-all');
            if (e.target.dataset.filter === 'all') {
                document.querySelectorAll('.filter-option input').forEach(cb => {
                    if (cb !== filterAllInput) {
                        cb.checked = false;
                    }
                });
            } else if (e.target.checked) {
                if (filterAllInput) filterAllInput.checked = false;
            }
            
            const anyOtherChecked = Array.from(document.querySelectorAll('.filter-option input:not(#filter-all)')).some(cb => cb.checked);
            if (!anyOtherChecked) {
                if (filterAllInput) filterAllInput.checked = true;
            }
            filterAndSortOffers();
        });
    });

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-option input').forEach(cb => {
                cb.checked = false;
            });
            const filterAllInput = document.getElementById('filter-all');
            if (filterAllInput) filterAllInput.checked = true;
            filterAndSortOffers();
        });
    }

    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
            
            const sortBy = e.target.getAttribute('data-sort-by');
            const sortOrder = e.target.getAttribute('data-sort-order');
            
            const icon = sortButton.querySelector('i');
            if (icon) {
                if (sortBy === 'default') {
                    icon.className = 'fas fa-sort';
                } else if (sortBy === 'price') {
                    icon.className = sortOrder === 'asc' ? 'fas fa-sort-amount-down-alt' : 'fas fa-sort-amount-up-alt';
                } else if (sortBy === 'discount') {
                    icon.className = sortOrder === 'desc' ? 'fas fa-percent' : 'fas fa-percent';
                }
            }

            filterAndSortOffers();
            if (sortDropdown) sortDropdown.classList.remove('show');
        });
    });

    if (searchButton) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            filterAndSortOffers();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAndSortOffers);
    }
    
    // Logica per night mode e PWA
    const themeSwitch = document.getElementById('checkbox');
    const nightModeClass = 'night-mode';
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === nightModeClass) {
        document.body.classList.add(nightModeClass);
        if (themeSwitch) themeSwitch.checked = true;
    }

    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => {
            document.body.classList.toggle(nightModeClass);
            if (document.body.classList.contains(nightModeClass)) {
                localStorage.setItem('theme', nightModeClass);
            } else {
                localStorage.setItem('theme', 'light-mode');
            }
        });
    }

    // Logica PWA
    let deferredPrompt;
    const installButton = document.getElementById('pwa-install-button');

    if (installButton) {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'block';
        });

        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    deferredPrompt = null;
                });
            }
        });
    }

    fetchOffers();
});
