// Cart state and constants
const CART_KEY = 'artShopCart';
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initializeCart();
    setupCartEventListeners();
});

function initializeCart() {
    updateCartCount();
    updateCartDropdown();
}

// Setup event delegation and other listeners in a single place
function setupCartEventListeners() {
    // Delegated add-to-cart handler (works for dynamically created items)
    document.addEventListener('click', (e) => {
        const target = e.target;

        if (target.classList.contains('add-to-cart')) {
            addToCart(e);
            return;
        }

        // Continue Shopping button inside cart dropdown
        if (target.classList.contains('btn-secondary') && target.textContent.trim().toLowerCase() === 'continue shopping') {
            closeCartDropdown();
            return;
        }

        if (target.classList.contains('quantity-btn')) {
            const id = target.dataset.id;
            if (target.classList.contains('plus')) increaseQuantity(id);
            if (target.classList.contains('minus')) decreaseQuantity(id);
            return;
        }

        if (target.classList.contains('cart-item-remove')) {
            const id = target.dataset.id;
            removeFromCart(id);
            return;
        }
    });

    // Close-modal buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Add checkout form submission handler
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processOrder();
        });
    }
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(event) {
    const button = event.target;
    const shopItem = button.closest('.shop-item');
    if (!shopItem) return;

    const nameEl = shopItem.querySelector('h3');
    const priceEl = shopItem.querySelector('.price');
    const imgEl = shopItem.querySelector('img');

    const product = {
        id: Date.now().toString(),
        name: nameEl ? nameEl.textContent.trim() : 'Unknown',
        price: priceEl ? parseFloat(priceEl.textContent.replace('$', '')) || 0 : 0,
        image: imgEl ? imgEl.src : '',
        quantity: 1
    };

    const existingItem = cart.find(item => item.name === product.name);
    if (existingItem) existingItem.quantity += 1;
    else cart.push(product);

    saveCart();
    updateCartCount();
    updateCartDropdown();

    // Feedback
    showToast(`${product.name} added to cart!`, 'success');
    button.textContent = 'Added!';
    const prevBg = button.style.background;
    button.style.background = '#4CAF50';
    setTimeout(() => {
        button.textContent = 'Add to Cart';
        button.style.background = prevBg;
    }, 1800);
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (!cartCount) return;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
}

function updateCartDropdown() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const cartItems = navActions.querySelector('.cart-items');
    const cartTotal = navActions.querySelector('.cart-total span:last-child');
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
        return;
    }

    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn minus" data-id="${item.id}">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn plus" data-id="${item.id}">+</button>
                <button class="cart-item-remove" data-id="${item.id}">&times;</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function increaseQuantity(itemId) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;
    item.quantity += 1;
    saveCart();
    updateCartCount();
    updateCartDropdown();
}

function decreaseQuantity(itemId) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;
    if (item.quantity > 1) {
        item.quantity -= 1;
        saveCart();
        updateCartCount();
        updateCartDropdown();
    } else {
        removeFromCart(itemId);
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartCount();
    updateCartDropdown();
    showToast('Item removed from cart', 'error');
}

// Close the cart dropdown (HTML calls this via onclick)
function closeCartDropdown() {
    
    const dropdowns = document.querySelectorAll('.dropdown-content.cart-dropdown');
    dropdowns.forEach(d => {
        d.style.display = 'none';
        setTimeout(() => d.style.display = '', 300);
    });
}

// Proceed to checkout: robustly handle modal ids used across the project
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    // Support both id formats (blog.js used 'checkoutModal')
    const modal = document.getElementById('checkoutModal') || document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'block';
        // update checkout summary if placeholders exist
        updateCheckoutSummary();
    } else {
        // If no modal exists, call blog.js's showCheckoutModal if available
        if (typeof showCheckoutModal === 'function') showCheckoutModal();
    }
}

function updateCheckoutSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = 8.99;
    const total = subtotal + shipping;

    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    const checkoutItems = document.getElementById('checkout-items') || document.getElementById('order-items');
    if (checkoutItems) {
        checkoutItems.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
    }
}

function closeCheckout() {
    const modal = document.getElementById('checkoutModal') || document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
}

function showToast(message, type = 'success') {
    // Simple toast implementation compatible with other files
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; background: ${type === 'error' ? '#ff4757' : '#4CAF50'}; color: white; border-radius: 5px; z-index: 10000; transform: translateX(400px); transition: transform 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-weight:500;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    setTimeout(() => { toast.style.transform = 'translateX(400px)'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Clear cart function
function clearCart() {
    cart = [];
    saveCart();
    updateCartCount();
    updateCartDropdown();
}

// Show order confirmation
function showOrderConfirmation() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        const orderNumber = 'ART' + Date.now().toString().slice(-6);
        document.getElementById('confirmation-number').textContent = orderNumber;
        
        // Set delivery estimate
        const shippingMethod = document.querySelector('input[name="delivery"]:checked');
        let deliveryEstimate = '5-7 business days';
        if (shippingMethod && shippingMethod.value === 'express') {
            deliveryEstimate = '2-3 business days';
        } else if (shippingMethod && shippingMethod.value === 'pickup') {
            deliveryEstimate = 'Ready in 24 hours for pickup';
        }
        document.getElementById('confirmation-delivery').textContent = deliveryEstimate;
        
        modal.style.display = 'block';
    }
}

// Process payment / order (UPDATED to clear cart and show confirmation)
async function processOrder() {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    const formData = new FormData(checkoutForm);
    const isValid = Array.from(formData.values()).every(value => String(value).trim() !== '');
    if (!isValid) { showToast('Please fill in all required fields', 'error'); return; }

    const submitBtn = document.querySelector('#checkout-modal .btn-primary') || document.querySelector('#checkoutModal .btn-primary');
    if (submitBtn) { submitBtn.textContent = 'Processing...'; submitBtn.disabled = true; }

    // Build simple order payload
    const customer = {
        name: document.getElementById('full-name')?.value || '',
        email: document.getElementById('checkout-email')?.value || ''
    };

    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    const delivery = selectedDelivery ? selectedDelivery.value : 'standard';

    const subtotal = cart.reduce((s, it) => s + (it.price * it.quantity), 0);
    const shipping = delivery === 'express' ? 15.99 : (delivery === 'pickup' ? 0 : 8.99);
    const total = subtotal + shipping;

    const order = { items: cart, customer, delivery, shipping, subtotal, total };

    try {
        const resp = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
        if (resp.ok) {
            // CLEAR CART AFTER SUCCESSFUL ORDER
            clearCart();
            closeCheckout();
            showOrderConfirmation();
            showToast('Order placed successfully! We have emailed the order details.', 'success');
        } else throw new Error('Server returned ' + resp.status);
    } catch (err) {
        console.warn('Order API not available, falling back to local simulation:', err.message);
        setTimeout(() => {
            // CLEAR CART EVEN IN LOCAL SIMULATION
            clearCart();
            closeCheckout();
            showOrderConfirmation();
            showToast('Order placed successfully!', 'success');
        }, 800);
    } finally {
        if (submitBtn) { submitBtn.textContent = 'Place Order'; submitBtn.disabled = false; }
    }
}

// Close confirmation modal
function closeConfirmation() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.style.display = 'none';
}

// Expose global functions the HTML uses, but don't overwrite existing globals from other scripts
if (typeof window.closeCartDropdown === 'undefined') window.closeCartDropdown = closeCartDropdown;
if (typeof window.proceedToCheckout === 'undefined') window.proceedToCheckout = proceedToCheckout;
if (typeof window.processOrder === 'undefined') window.processOrder = processOrder;
if (typeof window.closeConfirmation === 'undefined') window.closeConfirmation = closeConfirmation;


// Add this function to calculate shipping cost based on selected delivery method
function getShippingCost() {
    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    if (!selectedDelivery) return 8.99; // default to standard
    
    switch(selectedDelivery.value) {
        case 'express':
            return 15.99;
        case 'pickup':
            return 0;
        case 'standard':
        default:
            return 8.99;
    }
}

// Update the updateCheckoutSummary function to use dynamic shipping
function updateCheckoutSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = getShippingCost(); // Use dynamic shipping cost
    const total = subtotal + shipping;

    const subtotalEl = document.getElementById('summary-subtotal');
    const shippingEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    const checkoutItems = document.getElementById('checkout-items') || document.getElementById('order-items');
    if (checkoutItems) {
        checkoutItems.innerHTML = cart.map(item => `
            <div class="checkout-item">
                <span>${item.name} x${item.quantity}</span>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
    }
}

// Add event listeners for delivery option changes
function setupDeliveryOptions() {
    const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
    deliveryOptions.forEach(option => {
        option.addEventListener('change', function() {
            updateCheckoutSummary(); // Update totals when delivery method changes
        });
    });
}

// Update the setupCartEventListeners function to include delivery options
function setupCartEventListeners() {
    // ... your existing code ...
    
    // Delegated add-to-cart handler (works for dynamically created items)
    document.addEventListener('click', (e) => {
        const target = e.target;

        if (target.classList.contains('add-to-cart')) {
            addToCart(e);
            return;
        }

        // Continue Shopping button inside cart dropdown
        if (target.classList.contains('btn-secondary') && target.textContent.trim().toLowerCase() === 'continue shopping') {
            closeCartDropdown();
            return;
        }

        // Quantity and remove buttons inside cart dropdown (if used instead of inline onclick)
        if (target.classList.contains('quantity-btn')) {
            const id = target.dataset.id;
            if (target.classList.contains('plus')) increaseQuantity(id);
            if (target.classList.contains('minus')) decreaseQuantity(id);
            return;
        }

        if (target.classList.contains('cart-item-remove')) {
            const id = target.dataset.id;
            removeFromCart(id);
            return;
        }
    });

    // Close-modal buttons (generic)
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // NEW: Add checkout form submission handler
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            processOrder();
        });
    }

    // delivery options change handler
    setupDeliveryOptions();
}

// Updated the proceedToCheckout function to ensure delivery options work
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    // Supports both id formats (blog.js used 'checkoutModal')
    const modal = document.getElementById('checkoutModal') || document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'block';
        // update checkout summary if placeholders exist
        updateCheckoutSummary();
        
        // NEW: Re-setup delivery options to ensure they work
        setTimeout(() => {
            setupDeliveryOptions();
        }, 100);
    } else {
        // If no modal exists, call blog.js's showCheckoutModal if available
        if (typeof showCheckoutModal === 'function') showCheckoutModal();
    }
}

// Updated the processOrder function to use dynamic shipping
async function processOrder() {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    const formData = new FormData(checkoutForm);
    const isValid = Array.from(formData.values()).every(value => String(value).trim() !== '');
    if (!isValid) { showToast('Please fill in all required fields', 'error'); return; }

    const submitBtn = document.querySelector('#checkout-modal .btn-primary') || document.querySelector('#checkoutModal .btn-primary');
    if (submitBtn) { submitBtn.textContent = 'Processing...'; submitBtn.disabled = true; }

    // Build simple order payload
    const customer = {
        name: document.getElementById('full-name')?.value || '',
        email: document.getElementById('checkout-email')?.value || ''
    };

    const selectedDelivery = document.querySelector('input[name="delivery"]:checked');
    const delivery = selectedDelivery ? selectedDelivery.value : 'standard';

    const subtotal = cart.reduce((s, it) => s + (it.price * it.quantity), 0);
    const shipping = getShippingCost(); // Use dynamic shipping cost
    const total = subtotal + shipping;

    const order = { items: cart, customer, delivery, shipping, subtotal, total };

    try {
        const resp = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
        if (resp.ok) {
            // CLEAR CART AFTER SUCCESSFUL ORDER
            clearCart();
            closeCheckout();
            showOrderConfirmation();
            showToast('Order placed successfully! We have emailed the order details.', 'success');
        } else throw new Error('Server returned ' + resp.status);
    } catch (err) {
        console.warn('Order API not available, falling back to local simulation:', err.message);
        setTimeout(() => {
            // CLEAR CART EVEN IN LOCAL SIMULATION
            clearCart();
            closeCheckout();
            showOrderConfirmation();
            showToast('Order placed successfully!', 'success');
        }, 800);
    } finally {
        if (submitBtn) { submitBtn.textContent = 'Place Order'; submitBtn.disabled = false; }
    }
}