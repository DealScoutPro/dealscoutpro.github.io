document.addEventListener('DOMContentLoaded', () => {
    const offersGrid = document.getElementById('offersGrid');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');
    const sortButton = document.getElementById('sortButton');
    const sortDropdown = document.getElementById('sortDropdown');
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
        const activeFilter = document.querySelector('.filter-option.active');
        const filterType = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
        
        const activeSortOption = document.querySelector('.sort-option.active');
        const sortBy = activeSortOption ? activeSortOption.getAttribute('data-sort-by') : 'price';
        const sortOrder = activeSortOption ? activeSortOption.getAttribute('data-sort-order') : 'asc';
        
        let filtered = allOffers.filter(offer => {
            const matchesSearch = offer.title.toLowerCase().includes(searchTerm);
            if (filterType === 'all') return matchesSearch;
            if (filterType === 'discount-50') return matchesSearch && offer.discount >= 50;
            if (filterType === 'discount-30') return matchesSearch && offer.discount >= 30;
            if (filterType === 'discount-20') return matchesSearch && offer.discount >= 20;
            if (filterType === 'discount-10') return matchesSearch && offer.discount >= 10;
            return matchesSearch;
        });
        
        filtered.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (sortOrder === 'asc') return valA - valB;
            return valB - valA;
        });

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

    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
            filterAndSortOffers();
            filterDropdown.classList.remove('show');
        });
    });

    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
            e.target.classList.add('active');
            
            const sortBy = e.target.getAttribute('data-sort-by');
            const sortOrder = e.target.getAttribute('data-sort-order');
            
            const icon = sortButton.querySelector('i');
            if (sortBy === 'price') {
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