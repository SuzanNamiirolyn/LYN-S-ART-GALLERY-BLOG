// ===== GLOBAL VARIABLES =====
// ===== USER STATE =====
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isLoggedIn = !!currentUser;
let cart = currentUser ? currentUser.cart : [];

// Initialize the UserDatabase if not already done
if (typeof userDB === 'undefined') {
    userDB = new UserDatabase();
}

function logout() {
    // Clear user data
    localStorage.removeItem('currentUser');
    currentUser = null;
    isLoggedIn = false;
    cart = [];
    
    // Update UI
    updateUserInterface(false);
    
    // Update cart display
    updateCartCount();
    updateCartDropdown();
    
    // Show logout message
    showToast('You have been logged out', 'success');
}

function updateUserInterface(isLoggedIn, userName = '') {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.querySelector('.user-info');

    // Prefer explicit userName, fall back to currentUser if available
    const displayName = userName || currentUser?.name || '';

    if (isLoggedIn && displayName) {
        if (loginBtn) loginBtn.style.display = 'none';

        if (!userInfo) {
            createUserInfoSection(displayName);
        } else {
            userInfo.style.display = 'flex';
            const span = userInfo.querySelector('span');
            if (span) span.textContent = displayName;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}


function createUserInfoSection(userName) {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const nameToUse = userName || currentUser?.name || '';
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <div class="user-avatar">${nameToUse.charAt(0).toUpperCase()}</div>
        <span>${nameToUse}</span>
        <button class="logout-btn">Logout</button>
    `;

    // Insert before cart dropdown
    const cartDropdown = navActions.querySelector('.dropdown');
    if (cartDropdown) navActions.insertBefore(userInfo, cartDropdown);
    else navActions.appendChild(userInfo);

    // Add logout functionality
    const logoutBtn = userInfo.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

// Mock database for products
const productsDB = [
    {
        id: 1,
        name: "Abstract Painting",
        price: 299.99,
        image: "images/ab.webp",
        category: "paintings",
        description: "Beautiful abstract art piece"
    },
    {
        id: 2,
        name: "Modern Sculpture",
        price: 459.99,
        image: "images/sculp.jpg",
        category: "sculptures",
        description: "Contemporary sculpture design"
    },
    {
        id: 3,
        name: "Digital Art Print",
        price: 149.99,
        image: "images/digital.webp",
        category: "prints",
        description: "High-quality digital art print"
    },
    {
        id: 4,
        name: "Vintage Photography",
        price: 199.99,
        image: "images/IMG_4617.JPG",
        category: "photography",
        description: "Limited edition vintage photo"
    }
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('Art Shop initialized');
    initializeApp();
});

function initializeApp() {
    loadCart();
    updateCartCount();
    updateCartDropdown();
    initializeEventListeners();
    checkLoginStatus();
    initializeShopItems();
    initializeDeliveryModal();
}

// Initialize delivery functionality
function initializeDeliveryModal() {
    const deliveryBtn = document.getElementById('delivery-btn');
    const deliveryModal = document.getElementById('deliveryModal');
    const closeBtn = deliveryModal?.querySelector('.close-btn');
    
    // Load saved delivery preference
    const savedDelivery = localStorage.getItem('deliveryPreference');
    if (savedDelivery) {
        const radioBtn = deliveryModal?.querySelector(`input[value="${savedDelivery}"]`);
        if (radioBtn) radioBtn.checked = true;
    }

    // Show delivery modal when delivery button is clicked
    deliveryBtn?.addEventListener('click', function() {
        deliveryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close modal when close button is clicked
    closeBtn?.addEventListener('click', function() {
        deliveryModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close modal when clicking outside
    deliveryModal?.addEventListener('click', function(e) {
        if (e.target === deliveryModal) {
            deliveryModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Save delivery preference
function saveDeliveryChoice() {
    const selectedDelivery = document.querySelector('input[name="delivery-choice"]:checked');
    if (selectedDelivery) {
        localStorage.setItem('deliveryPreference', selectedDelivery.value);
        
        // Update shipping cost in checkout if it's open
        updateShippingCost(selectedDelivery.value);
        
        const deliveryModal = document.getElementById('deliveryModal');
        deliveryModal.classList.remove('active');
        document.body.style.overflow = '';
        
        showToast('Delivery preference saved!', 'success');
    }
}

// Update shipping cost based on delivery choice
function updateShippingCost(deliveryType) {
    const shippingElement = document.getElementById('summary-shipping');
    if (!shippingElement) return;

    let shippingCost = 0;
    switch (deliveryType) {
        case 'express':
            shippingCost = 15.99;
            break;
        case 'standard':
            shippingCost = 8.99;
            break;
        case 'pickup':
            shippingCost = 0;
            break;
    }

    // Update shipping cost display
    shippingElement.textContent = `$${shippingCost.toFixed(2)}`;
    
    // Recalculate total
    const subtotalElement = document.getElementById('summary-subtotal');
    const totalElement = document.getElementById('summary-total');
    if (subtotalElement && totalElement) {
        const subtotal = parseFloat(subtotalElement.textContent.replace('$', ''));
        const total = subtotal + shippingCost;
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // ===== LOGIN MODAL FUNCTIONALITY =====
    // (Initialize login modal from DOMContentLoaded in main initialization)

function initializeLoginModal() {
    // Get all necessary DOM elements
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const closeBtns = document.querySelectorAll('.login-modal .close-btn');
    const switchToSignup = document.querySelectorAll('.switch-to-signup');
    const switchToLogin = document.querySelectorAll('.switch-to-login');
    
    // Initialize forms
    initializeLoginForm();
    initializeSignupForm();
    
    function initializeLoginForm() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', handleLogin);
        }
    }
    
    function initializeSignupForm() {
        const form = document.getElementById('signupForm');
        if (form) {
            form.addEventListener('submit', handleSignup);
        }
    }
    
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        const loginResult = userDB.loginUser(email, password);
        
        if (loginResult.success) {
            currentUser = loginResult.user;
            isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserInterface(true);
            loginModal.classList.remove('active');
            document.body.style.overflow = '';
            
            showToast('Welcome back, ' + currentUser.name + '!', 'success');
            e.target.reset();
            
            // Update cart if necessary
            if (currentUser.cart) {
                cart = currentUser.cart;
                updateCartCount();
                updateCartDropdown();
            }
        } else {
            showToast(loginResult.message || 'Login failed. Please try again.', 'error');
        }
    }
    
    function handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        
        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        const registerResult = userDB.registerUser(email, password, name);
        
        if (registerResult.success) {
            currentUser = registerResult.user;
            isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            updateUserInterface(true);
            signupModal.classList.remove('active');
            document.body.style.overflow = '';
            
            showToast('Welcome to Lyn\'s Art Gallery, ' + currentUser.name + '!', 'success');
            e.target.reset();
            
            // Initialize empty cart for new user
            cart = [];
            updateCartCount();
            updateCartDropdown();
        } else {
            showToast(registerResult.message || 'Registration failed. Please try again.', 'error');
        }
    }
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    // Show login modal when login button is clicked
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();
            
            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            const loginResult = userDB.loginUser(email, password);
            
            if (loginResult.success) {
                currentUser = loginResult.user;
                isLoggedIn = true;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update UI
                updateUserInterface(true);
                loginModal.classList.remove('active');
                document.body.style.overflow = '';
                
                showToast('Welcome back, ' + currentUser.name + '!', 'success');
                loginForm.reset();
            } else {
                showToast(loginResult.message, 'error');
            }
        });
    }

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();
            
            if (!name || !email || !password || !confirmPassword) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }
            
            const registerResult = userDB.registerUser(email, password, name);
            
            if (registerResult.success) {
                currentUser = registerResult.user;
                isLoggedIn = true;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Update UI
                updateUserInterface(true);
                signupModal.classList.remove('active');
                document.body.style.overflow = '';
                
                showToast('Welcome to Lyn\'s Art Gallery, ' + currentUser.name + '!', 'success');
                signupForm.reset();
            } else {
                showToast(registerResult.message, 'error');
            }
        });
    }
    
    // Close modal functionality for all close buttons
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.login-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            }
        });
    });
    
    // Close modal when clicking outside
    [loginModal, signupModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    });

    // Switch between login and signup modals
    switchToSignup.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.classList.remove('active');
            signupModal.classList.add('active');
        });
    });

    switchToLogin.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            signupModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    });
    
}function updateUserInterface(isLoggedIn, userName = '') {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.querySelector('.user-info');
    
    if (isLoggedIn && userName) {
        // Change login button to user info
        if (loginBtn) {
            loginBtn.style.display = 'none';
        }
        
        // Create or update user info section
        if (!userInfo) {
            createUserInfoSection(userName);
        } else {
            userInfo.style.display = 'flex';
            userInfo.querySelector('span').textContent = userName;
        }
    } else {
        // Show login button
        if (loginBtn) {
            loginBtn.style.display = 'block';
        }
        
        // Hide user info
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }
}

function createUserInfoSection(userName) {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;
    
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
        <span>${userName}</span>
        <button class="logout-btn">Logout</button>
    `;
    
    // Insert before login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        navActions.insertBefore(userInfo, loginBtn);
    } else {
        navActions.appendChild(userInfo);
    }
    
    // Add logout functionality
    const logoutBtn = userInfo.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

// Check login status on page load
function checkLoginStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        updateUserInterface(true, user.name);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize login functionality
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('loginModal');
    const closeButtons = document.querySelectorAll('.close-btn');

    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close button functionality
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal, .login-modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Switch between login and signup
    const switchToSignup = document.querySelectorAll('.switch-to-signup');
    const switchToLogin = document.querySelectorAll('.switch-to-login');
    const signupModal = document.getElementById('signupModal');

    switchToSignup.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.classList.remove('active');
            signupModal.classList.add('active');
        });
    });

    switchToLogin.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            signupModal.classList.remove('active');
            loginModal.classList.add('active');
        });
    });

    checkLoginStatus();
    initializeCart();
});

    // Forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const signupForm = document.getElementById('signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    // Modal switching
    document.querySelectorAll('.switch-to-signup').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSignupModal();
        });
    });
    
    document.querySelectorAll('.switch-to-login').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginModal();
        });
    });

}

function initializeShopItems() {
    const shopContent = document.querySelector('.shop-content');
    if (!shopContent) return;

    shopContent.innerHTML = productsDB.map(product => `
        <div class="shop-item" data-category="${product.category}">
            <div class="shop-img">
                <img src="${product.image}" alt="${product.name}">
                <div class="art-badge">New</div>
            </div>
            <div class="shop-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="shop-meta">
                    <div class="price">$${product.price.toFixed(2)}</div>
                    <div class="size">24" x 36"</div>
                </div>
                <button class="add-to-cart" data-product-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners to the new cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// ===== CHECKOUT FUNCTIONALITY =====

function proceedToCheckout() {
    if (!isLoggedIn) {
        showToast('Please login to checkout', 'error');
        document.getElementById('loginModal').classList.add('active');
        return;
    }
    
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    showCheckoutModal();
}

function processPayment() {
    if (!isLoggedIn) {
        showToast('Please login to complete your purchase', 'error');
        document.getElementById('loginModal').classList.add('active');
        return;
    }

    const form = document.getElementById('checkoutForm');
    if (!form) return;

    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#ff4757';
        } else {
            input.style.borderColor = '';
        }
    });

    if (!isValid) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Show processing state
    const submitBtn = document.querySelector('#checkoutModal .btn-primary');
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    // Simulate payment processing
    setTimeout(() => {
        showToast('Payment successful! Your order has been placed.', 'success');
        
        // Clear cart
        cart = [];
        saveCart();
        updateCartCount();
        updateCartDropdown();
        
        closeCheckoutModal();
        
        // Show order confirmation
        setTimeout(() => {
            showToast(`Order confirmed! You'll receive an email confirmation shortly.`, 'success');
        }, 3000);
    }, 2000);
}

// ===== TOAST NOTIFICATIONS =====

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ff4757' : '#4CAF50'};
        color: white;
        border-radius: 5px;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-weight: 500;
    `;

    document.body.appendChild(toast);
    
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
