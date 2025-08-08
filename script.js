document.addEventListener('DOMContentLoaded', () => {
    const offersGrid = document.getElementById('offersGrid');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');
    const sortButton = document.getElementById('sortButton');
    const sortDropdown = document.getElementById('sortDropdown');
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
            offersGrid.innerHTML = '<p>Errore nel caricamento delle offerte.</p>';
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
        offersGrid.innerHTML = '';
        if (offers.length === 0) {
            offersGrid.innerHTML = '<p>Nessuna offerta trovata.</p>';
            return;
        }
        offers.forEach(offer => offersGrid.appendChild(createOfferCard(offer)));
    };

    const filterAndSortOffers = () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        const selectedFilters = Array.from(document.querySelectorAll('.filter-option input:checked')).map(input => input.dataset.filter);
        const sortBy = document.querySelector('.sort-option.active').dataset.sortBy;
        const sortOrder = document.querySelector('.sort-option.active').dataset.sortOrder;
        
        let filtered = allOffers.filter(offer => {
            const matchesSearch = offer.title.toLowerCase().includes(searchTerm);
            
            if (selectedFilters.includes('all')) {
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
        const isVisible = dropdown.classList.contains('show');
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
        if (!isVisible) {
            dropdown.classList.add('show');
        }
    };

    filterButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (filterDropdown) {
            toggleDropdown(filterDropdown);
        }
    });
    
    sortButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sortDropdown) {
            toggleDropdown(sortDropdown);
        }
    });

    document.addEventListener('click', (e) => {
        if (!filterButton.contains(e.target) && !sortButton.contains(e.target) && !filterDropdown.contains(e.target) && !sortDropdown.contains(e.target)) {
            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
        }
    });

    document.querySelectorAll('.filter-option input').forEach(input => {
        input.addEventListener('change', (e) => {
            const filterAllInput = document.getElementById('filter-all');
            if (e.target.dataset.filter === 'all') {
                document.querySelectorAll('.filter-option input').forEach(cb => {
                    if (cb !== filterAllInput) {
                        cb.checked = false;
                    }
                });
            } else if (e.target.checked) {
                filterAllInput.checked = false;
            }

            const anyOtherChecked = Array.from(document.querySelectorAll('.filter-option input:not(#filter-all)')).some(cb => cb.checked);
            if (!anyOtherChecked) {
                filterAllInput.checked = true;
            }
            
            filterAndSortOffers();
        });
    });

    clearFiltersButton.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.filter-option input').forEach(cb => {
            cb.checked = false;
        });
        document.getElementById('filter-all').checked = true;
        filterAndSortOffers();
    });

    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
            
            const sortBy = e.target.getAttribute('data-sort-by');
            const sortOrder = e.target.getAttribute('data-sort-order');
            
            const icon = sortButton.querySelector('i');
            if (sortBy === 'default') {
                icon.className = 'fas fa-sort-amount-down-alt';
            } else if (sortBy === 'price') {
                icon.className = sortOrder === 'asc' ? 'fas fa-sort-amount-down-alt' : 'fas fa-sort-amount-up-alt';
            } else if (sortBy === 'discount') {
                icon.className = sortOrder === 'desc' ? 'fas fa-percent' : 'fas fa-percent fa-flip-vertical';
            }

            filterAndSortOffers();
            sortDropdown.classList.remove('show');
        });
    });

    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        filterAndSortOffers();
    });

    searchInput.addEventListener('input', filterAndSortOffers);

    fetchOffers();
});
document.addEventListener('DOMContentLoaded', () => {
    // Logica per night mode
    const themeSwitch = document.getElementById('checkbox');
    const nightModeClass = 'night-mode';
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === nightModeClass) {
        document.body.classList.add(nightModeClass);
        themeSwitch.checked = true;
    }

    themeSwitch.addEventListener('change', () => {
        document.body.classList.toggle(nightModeClass);
        if (document.body.classList.contains(nightModeClass)) {
            localStorage.setItem('theme', nightModeClass);
        } else {
            localStorage.setItem('theme', 'light-mode');
        }
    });

    // Logica per PWA
    let deferredPrompt;
    const installButton = document.getElementById('pwa-install-button');

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
});
