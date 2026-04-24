// ============================================
// SWEET BRICEÑO - MAIN JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // STATE MANAGEMENT
    // ============================================
    let cart = JSON.parse(localStorage.getItem('sweetbriceno_cart')) || [];
    let wishlist = JSON.parse(localStorage.getItem('sweetbriceno_wishlist')) || [];
    
    // ============================================
    // HERO SLIDER
    // ============================================
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    let currentSlide = 0;
    let slideInterval;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        currentSlide = index;
    }
    
    function nextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }
    
    function prevSlide() {
        showSlide((currentSlide - 1 + slides.length) % slides.length);
    }
    
    function startSlider() {
        slideInterval = setInterval(nextSlide, 5000);
    }
    
    function stopSlider() {
        clearInterval(slideInterval);
    }
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            stopSlider();
            prevSlide();
            startSlider();
        });
        
        nextBtn.addEventListener('click', () => {
            stopSlider();
            nextSlide();
            startSlider();
        });
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopSlider();
            showSlide(index);
            startSlider();
        });
    });
    
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopSlider);
        sliderContainer.addEventListener('mouseleave', startSlider);
    }
    
    // Touch support for slider
    let touchStartX = 0;
    let touchEndX = 0;
    
    if (sliderContainer) {
        sliderContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopSlider();
        }, {passive: true});
        
        sliderContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) nextSlide();
                else prevSlide();
            }
            startSlider();
        }, {passive: true});
    }
    
    startSlider();
    
    // ============================================
    // CATEGORIES CAROUSEL
    // ============================================
    const catCarousel = document.getElementById('categoriesCarousel');
    const catPrev = document.getElementById('catPrev');
    const catNext = document.getElementById('catNext');
    
    if (catCarousel && catPrev && catNext) {
        const scrollAmount = 200;
        
        catPrev.addEventListener('click', () => {
            catCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        
        catNext.addEventListener('click', () => {
            catCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
        
        // Hide arrows at boundaries
        function updateCatArrows() {
            catPrev.style.opacity = catCarousel.scrollLeft <= 0 ? '0.3' : '1';
            catNext.style.opacity = 
                catCarousel.scrollLeft >= catCarousel.scrollWidth - catCarousel.clientWidth - 10 
                ? '0.3' : '1';
        }
        
        catCarousel.addEventListener('scroll', updateCatArrows);
        updateCatArrows();
    }
    
    // ============================================
    // RENDER PRODUCTS
    // ============================================
    const productsGrid = document.getElementById('productsGrid');
    
    function renderProducts(productList = products) {
        if (!productsGrid) return;
        
        productsGrid.innerHTML = productList.map(product => {
            const isInCart = cart.some(item => item.id === product.id);
            const isInWishlist = wishlist.some(item => item.id === product.id);
            
            let badgeHTML = '';
            if (product.badge === 'new') {
                badgeHTML = '<span class="product-badge badge-new">Nuevo</span>';
            } else if (product.badge === 'sale') {
                badgeHTML = '<span class="product-badge badge-sale">Oferta</span>';
            }
            
            const priceHTML = product.originalPrice 
                ? `<span class="original-price">S/ ${product.originalPrice.toFixed(2)}</span>
                   <span class="current-price">S/ ${product.price.toFixed(2)}</span>`
                : `<span class="current-price">S/ ${product.price.toFixed(2)}</span>`;
            
            return `
                <div class="product-card" data-id="${product.id}">
                    ${badgeHTML}
                    <div class="product-img">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        <div class="product-actions">
                            <button class="action-btn ${isInWishlist ? 'active' : ''}" 
                                    onclick="toggleWishlist(${product.id})" 
                                    aria-label="Favorito">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="action-btn" 
                                    onclick="quickView(${product.id})" 
                                    aria-label="Vista rápida">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <div class="product-price">
                            ${priceHTML}
                        </div>
                        <button class="btn-add-cart" onclick="addToCart(${product.id})">
                            <i class="fas fa-shopping-cart"></i>
                            ${isInCart ? 'En carrito' : 'Añadir al carrito'}
                        </button>
                    </div>
            `;
        }).join('');
    }
    
    renderProducts();
    
    // Make functions globally available
    window.toggleWishlist = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const index = wishlist.findIndex(item => item.id === productId);
        
        if (index === -1) {
            wishlist.push(product);
            showToast(`${product.name} añadido a favoritos`);
        } else {
            wishlist.splice(index, 1);
            showToast(`${product.name} eliminado de favoritos`);
        }
        
        localStorage.setItem('sweetbriceno_wishlist', JSON.stringify(wishlist));
        updateWishlistCount();
        renderWishlist();
        renderProducts(); // Re-render to update heart icon
    };
    
    window.addToCart = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
            showToast(`Cantidad actualizada: ${product.name}`);
        } else {
            cart.push({ ...product, quantity: 1 });
            showToast(`${product.name} añadido al carrito`);
        }
        
        localStorage.setItem('sweetbriceno_cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
        renderProducts(); // Re-render to update button text
    };
    
    window.quickView = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        showToast(`Vista rápida: ${product.name}`);
    };
    
    // ============================================
    // CART FUNCTIONS
    // ============================================
    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountEl = document.getElementById('cartCount');
        if (cartCountEl) {
            cartCountEl.textContent = count;
            cartCountEl.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    function renderCart() {
        const cartItemsEl = document.getElementById('cartItems');
        const cartFooterEl = document.getElementById('cartFooter');
        const cartTotalEl = document.getElementById('cartTotal');
        
        if (!cartItemsEl) return;
        
        if (cart.length === 0) {
            cartItemsEl.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Tu carrito está vacío</p>
                    <button class="btn btn-primary" onclick="closeCart()">Ver productos</button>
                </div>
            `;
            if (cartFooterEl) cartFooterEl.style.display = 'none';
            return;
        }
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span class="price">S/ ${item.price.toFixed(2)}</span>
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
            </div>
        `).join('');
        
        if (cartFooterEl) cartFooterEl.style.display = 'block';
        if (cartTotalEl) cartTotalEl.textContent = `S/ ${total.toFixed(2)}`;
    }
    
    window.updateQuantity = function(productId, change) {
        const item = cart.find(item => item.id === productId);
        if (!item) return;
        
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        localStorage.setItem('sweetbriceno_cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    };
    
    window.removeFromCart = function(productId) {
        const item = cart.find(item => item.id === productId);
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('sweetbriceno_cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
        renderProducts();
        if (item) showToast(`${item.name} eliminado del carrito`);
    };
    
    // ============================================
    // WISHLIST FUNCTIONS
    // ============================================
    function updateWishlistCount() {
        const count = wishlist.length;
        const wishlistCountEl = document.getElementById('wishlistCount');
        if (wishlistCountEl) {
            wishlistCountEl.textContent = count;
            wishlistCountEl.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    
    function renderWishlist() {
        const wishlistItemsEl = document.getElementById('wishlistItems');
        if (!wishlistItemsEl) return;
        
        if (wishlist.length === 0) {
            wishlistItemsEl.innerHTML = `
                <div class="wishlist-empty">
                    <i class="fas fa-heart-broken"></i>
                    <p>No tienes productos favoritos</p>
                    <button class="btn btn-primary" onclick="closeWishlist()">Ver productos</button>
                </div>
            `;
            return;
        }
        
        wishlistItemsEl.innerHTML = wishlist.map(item => `
            <div class="wishlist-item">
                <div class="wishlist-item-img">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="wishlist-item-info">
                    <h4>${item.name}</h4>
                    <span class="price">S/ ${item.price.toFixed(2)}</span>
                    <div class="wishlist-item-actions">
                        <button class="btn btn-primary btn-sm" onclick="addToCart(${item.id}); toggleWishlist(${item.id})">
                            <i class="fas fa-shopping-cart"></i> Añadir
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="toggleWishlist(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
            </div>
        `).join('');
    }
    
    // ============================================
    // DRAWER TOGGLES
    // ============================================
    const overlay = document.getElementById('overlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const wishlistDrawer = document.getElementById('wishlistDrawer');
    const mobileDrawer = document.getElementById('mobileDrawer');
    
    function openDrawer(drawer) {
        drawer.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeAllDrawers() {
        cartDrawer?.classList.remove('open');
        wishlistDrawer?.classList.remove('open');
        mobileDrawer?.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    window.closeCart = function() {
        cartDrawer?.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    window.closeWishlist = function() {
        wishlistDrawer?.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    // Cart button
    document.getElementById('cartBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        renderCart();
        openDrawer(cartDrawer);
    });
    
    // Wishlist button
    document.getElementById('wishlistBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        renderWishlist();
        openDrawer(wishlistDrawer);
    });
    
    // Mobile menu button
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        openDrawer(mobileDrawer);
    });
    
    // Close buttons
    document.getElementById('closeCartDrawer')?.addEventListener('click', closeCart);
    document.getElementById('closeWishlistDrawer')?.addEventListener('click', closeWishlist);
    document.getElementById('closeMobileDrawer')?.addEventListener('click', closeAllDrawers);
    
    // Continue shopping
    document.getElementById('continueShopping')?.addEventListener('click', closeCart);
    
    // Overlay click
    overlay?.addEventListener('click', closeAllDrawers);
    
    // Account button - show toast
    document.getElementById('accountBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Inicio de sesión próximamente');
    });
    
    // ============================================
    // SEARCH FUNCTIONALITY
    // ============================================
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchForm = document.getElementById('searchForm');
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            if (query.length < 2) {
                searchResults.classList.remove('active');
                return;
            }
            
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query)
            );
            
            if (filtered.length === 0) {
                searchResults.innerHTML = '<div class="search-no-results">No se encontraron productos</div>';
            } else {
                searchResults.innerHTML = filtered.slice(0, 6).map(product => `
                    <div class="search-result-item" onclick="addToCart(${product.id}); searchResults.classList.remove('active'); searchInput.value='';">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="search-result-info">
                            <h4>${product.name}</h4>
                            <span>S/ ${product.price.toFixed(2)}</span>
                        </div>
                `).join('');
            }
            
            searchResults.classList.add('active');
        });
        
        // Close search results on click outside
        document.addEventListener('click', (e) => {
            if (!searchForm.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });
        
        // Prevent form submission
        searchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.toLowerCase().trim();
            if (query) {
                const filtered = products.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    p.category.toLowerCase().includes(query)
                );
                renderProducts(filtered);
                searchResults.classList.remove('active');
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // ============================================
    // TOAST NOTIFICATION
    // ============================================
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    window.showToast = showToast;
    
    // ============================================
    // BACK TO TOP
    // ============================================
    const backToTop = document.getElementById('backToTop');
    
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // ============================================
    // NEWSLETTER FORM
    // ============================================
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            if (email) {
                showToast('¡Gracias por suscribirte! Recibirás nuestras ofertas pronto.');
                newsletterForm.reset();
            }
        });
    }
    
    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe sections
    document.querySelectorAll('.section-header, .product-card, .feature-item, .category-card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
    
    // ============================================
    // INITIALIZE
    // ============================================
    updateCartCount();
    updateWishlistCount();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
});
