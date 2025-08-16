// Main application module - orchestrates all other modules

// Application state
let app = {
    initialized: false,
    currentUser: {
        id: 'client1',
        name: 'Иван Петров',
        email: 'ivan.petrov@example.com',
        role: 'client'
    },
    modules: {},
    isMobile: false,
    isTablet: false
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading('Инициализация приложения...');
        
        // Detect device type
        detectDeviceType();
        
        // Initialize all modules in order
        await initializeModules();
        
        // Set up global event listeners
        setupGlobalEventListeners();
        
        // Initialize tooltips and UI enhancements
        initializeUIEnhancements();
        
        // Setup responsive behavior
        setupResponsiveBehavior();
        
        // Mark app as initialized
        app.initialized = true;
        
        hideLoading();
        
        // Show welcome message for first-time users
        showWelcomeIfNeeded();
        
        console.log('🚀 WoodCraft Client Portal initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        hideLoading();
        showNotification('error', 'Ошибка инициализации приложения. Пожалуйста, обновите страницу.');
    }
}

// Detect device type
function detectDeviceType() {
    const width = window.innerWidth;
    app.isMobile = width < 768;
    app.isTablet = width >= 768 && width < 1024;
    
    // Add classes to body
    document.body.classList.toggle('mobile', app.isMobile);
    document.body.classList.toggle('tablet', app.isTablet);
    document.body.classList.toggle('desktop', !app.isMobile && !app.isTablet);
}

// Initialize all modules
async function initializeModules() {
    const modules = [
        { 
            name: 'modals', 
            init: () => {
                if (window.popupsModule?.initializeModals) {
                    window.popupsModule.initializeModals();
                    return Promise.resolve();
                }
                return Promise.reject(new Error('popupsModule not available'));
            },
            required: true
        },
        { 
            name: 'table', 
            init: () => {
                if (window.tableModule?.initializeTable) {
                    window.tableModule.initializeTable();
                    return Promise.resolve();
                }
                return Promise.reject(new Error('tableModule not available'));
            },
            required: true
        },
        { 
            name: 'filters', 
            init: () => {
                if (window.filtersModule?.initializeFilters) {
                    window.filtersModule.initializeFilters();
                    return Promise.resolve();
                }
                return Promise.reject(new Error('filtersModule not available'));
            },
            required: true
        }
    ];
    
    for (const module of modules) {
        try {
            if (module.init) {
                await module.init();
                app.modules[module.name] = true;
                console.log(`✅ ${module.name} module initialized`);
                
                // Small delay between modules to ensure DOM stability
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch (error) {
            console.error(`❌ Failed to initialize ${module.name} module:`, error);
            if (module.required) {
                throw error;
            }
        }
    }
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Navigation handling
    setupNavigation();
    
    // User menu handling
    setupUserMenu();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Window events
    setupWindowEvents();
    
    // Performance monitoring
    setupPerformanceMonitoring();
    
    // Touch events for mobile
    if (app.isMobile) {
        setupMobileEvents();
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Handle navigation
            const linkText = link.textContent.trim();
            handleNavigation(linkText);
        });
    });
    
    // Mobile navigation specific setup
    if (app.isMobile) {
        // Show mobile navigation
        const nav = document.querySelector('.nav');
        if (nav) {
            nav.style.display = 'flex';
        }
    }
}

// Handle navigation
function handleNavigation(section) {
    switch (section) {
        case 'Заказы':
            // Already on orders page - scroll to top on mobile
            if (app.isMobile) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            break;
        case 'Проекты':
            showNotification('success', 'Переход в раздел "Проекты" (в разработке)');
            break;
        case 'Профиль':
            showUserProfile();
            break;
        default:
            console.log('Unknown navigation target:', section);
    }
}

// Setup user menu
function setupUserMenu() {
    // Toggle user dropdown
    window.toggleUserMenu = function() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    };
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = e.target.closest('.user-menu');
        const dropdown = document.getElementById('userDropdown');
        
        if (!userMenu && dropdown) {
            dropdown.classList.remove('show');
        }
    });
    
    // Handle dropdown items
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const text = item.textContent.trim();
            
            if (text === 'Настройки') {
                showNotification('success', 'Настройки (в разработке)');
            } else if (text === 'Выйти') {
                handleLogout();
            }
            
            // Close dropdown
            document.getElementById('userDropdown').classList.remove('show');
        });
    });
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Global shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    createNewOrder();
                    break;
                case 'f':
                    e.preventDefault();
                    document.getElementById('searchInput')?.focus();
                    break;
                case ',':
                    e.preventDefault();
                    showNotification('success', 'Настройки (Ctrl+,)');
                    break;
            }
        }
        
        // Alt shortcuts (disabled on mobile for better UX)
        if (e.altKey && !app.isMobile) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    window.filtersModule?.filterByStatus('draft');
                    break;
                case '2':
                    e.preventDefault();
                    window.filtersModule?.filterByStatus('submitted');
                    break;
                case '3':
                    e.preventDefault();
                    window.filtersModule?.filterByStatus('approved');
                    break;
                case '4':
                    e.preventDefault();
                    window.filtersModule?.filterByStatus('revision');
                    break;
            }
        }
    });
}

// Setup mobile-specific events
function setupMobileEvents() {
    // Pull to refresh simulation
    let startY = 0;
    let pullDistance = 0;
    const refreshThreshold = 80;
    
    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (window.scrollY === 0 && startY > 0) {
            pullDistance = e.touches[0].clientY - startY;
            if (pullDistance > 0 && pullDistance < refreshThreshold) {
                // Visual feedback for pull to refresh
                document.body.style.transform = `translateY(${pullDistance * 0.3}px)`;
            }
        }
    });
    
    document.addEventListener('touchend', () => {
        if (pullDistance > refreshThreshold) {
            // Trigger refresh
            refreshData();
            showNotification('success', 'Данные обновлены');
        }
        
        // Reset
        startY = 0;
        pullDistance = 0;
        document.body.style.transform = '';
    });
    
    // Prevent zoom on double tap for better UX
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

// Setup window events
function setupWindowEvents() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && app.initialized) {
            // Refresh data when page becomes visible
            refreshData();
        }
    });
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        hideNotification('errorNotification');
        showNotification('success', 'Соединение восстановлено', 3000);
    });
    
    window.addEventListener('offline', () => {
        showNotification('error', 'Нет соединения с интернетом', 0);
    });
    
    // Handle window resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            handleWindowResize();
        }, 250);
    });
    
    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            handleWindowResize();
            // Force repaint to fix potential layout issues
            document.body.style.display = 'none';
            document.body.offsetHeight;
            document.body.style.display = '';
        }, 100);
    });
}

// Setup responsive behavior
function setupResponsiveBehavior() {
    // Initial setup
    handleWindowResize();
    
    // Setup intersection observer for scroll-based animations
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe stat cards for animation
        document.querySelectorAll('.stat-card').forEach(card => {
            observer.observe(card);
        });
    }
}

// Setup performance monitoring
function setupPerformanceMonitoring() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn('⚠️ Long task detected:', entry.duration + 'ms');
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            // Ignore if not supported
        }
    }
    
    // Monitor memory usage (if available)
    if ('memory' in performance) {
        setInterval(() => {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
            
            if (usedMB > limitMB * 0.8) {
                console.warn('⚠️ High memory usage:', usedMB + 'MB /' + limitMB + 'MB');
            }
        }, 30000);
    }
    
    // Track page load performance
    window.addEventListener('load', () => {
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                const loadTime = navigation.loadEventEnd - navigation.fetchStart;
                console.log(`📊 Page load time: ${Math.round(loadTime)}ms`);
                
                if (loadTime > 3000) {
                    console.warn('⚠️ Slow page load detected');
                }
            }
        }, 0);
    });
}

// Initialize UI enhancements
function initializeUIEnhancements() {
    // Initialize tooltips
    initializeTooltips();
    
    // Add loading states to buttons
    enhanceButtons();
    
    // Add smooth scrolling
    enableSmoothScrolling();
    
    // Initialize responsive tables
    makeTablesResponsive();
    
    // Add accessibility features
    enhanceAccessibility();
    
    // Setup animations
    setupAnimations();
}

// Initialize tooltips
function initializeTooltips() {
    const elementsWithTooltips = document.querySelectorAll('[title]');
    elementsWithTooltips.forEach(element => {
        // Skip if already processed
        if (element.hasAttribute('data-tooltip')) return;
        
        // Convert title to data-tooltip for better control
        const title = element.getAttribute('title');
        if (title) {
            element.setAttribute('data-tooltip', title);
            element.removeAttribute('title');
            
            // Add tooltip styles if not already added
            if (!document.querySelector('#tooltip-styles')) {
                addTooltipStyles();
            }
        }
    });
}

// Add tooltip styles
function addTooltipStyles() {
    const styles = `
        [data-tooltip] {
            position: relative;
            cursor: help;
        }
        
        [data-tooltip]:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            margin-bottom: 5px;
            opacity: 0;
            animation: tooltip-fade-in 0.2s ease forwards;
        }
        
        [data-tooltip]:hover::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: #1f2937;
            z-index: 1000;
            opacity: 0;
            animation: tooltip-fade-in 0.2s ease forwards;
        }
        
        @keyframes tooltip-fade-in {
            to { opacity: 1; }
        }
        
        /* Disable tooltips on mobile */
        @media (max-width: 767px) {
            [data-tooltip]:hover::after,
            [data-tooltip]:hover::before {
                display: none;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'tooltip-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Enhance buttons with loading states and ripple effects
function enhanceButtons() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        // Skip if already enhanced
        if (button.hasAttribute('data-enhanced')) return;
        
        button.setAttribute('data-enhanced', 'true');
        
        button.addEventListener('click', function(e) {
            // Add ripple effect (disabled on mobile for performance)
            if (!app.isMobile) {
                addRippleEffect(this, e);
            }
        });
    });
}

// Add ripple effect to buttons
function addRippleEffect(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
    `;
    
    // Add ripple animation if not exists
    if (!document.querySelector('#ripple-styles')) {
        const styles = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            .btn {
                position: relative;
                overflow: hidden;
            }
        `;
        const styleSheet = document.createElement('style');
        styleSheet.id = 'ripple-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// Enable smooth scrolling
function enableSmoothScrolling() {
    // Only enable on desktop for performance
    if (!app.isMobile) {
        document.documentElement.style.scrollBehavior = 'smooth';
    }
}

// Make tables responsive
function makeTablesResponsive() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.closest('.table-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

// Setup animations
function setupAnimations() {
    // Add entrance animations to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
}

// Enhance accessibility
function enhanceAccessibility() {
    // Add ARIA labels where missing
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
        const icon = button.querySelector('i');
        const text = button.textContent.trim();
        
        if (!text && icon) {
            // Button with only icon
            const title = button.getAttribute('title') || button.getAttribute('data-tooltip');
            if (title) {
                button.setAttribute('aria-label', title);
            }
        }
    });
    
    // Add focus indicators
    const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.classList.add('focused');
        });
        
        element.addEventListener('blur', function() {
            this.classList.remove('focused');
        });
    });
    
    // Add skip link for keyboard navigation
    if (!document.querySelector('#skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.id = 'skip-link';
        skipLink.href = '#main-content';
        skipLink.textContent = 'Перейти к основному содержимому';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add id to main content
        const main = document.querySelector('.main');
        if (main) {
            main.id = 'main-content';
            main.setAttribute('tabindex', '-1');
        }
    }
}

// Utility functions
function showLoading(message = 'Загрузка...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = overlay?.querySelector('p');
    
    if (overlay) {
        if (text) text.textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function refreshData() {
    if (!app.initialized) return;
    
    console.log('🔄 Refreshing data...');
    
    // Show subtle loading indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        z-index: 1000;
        animation: fadeInOut 2s ease;
    `;
    refreshIndicator.innerHTML = '<i class="fas fa-sync fa-spin"></i> Обновление...';
    document.body.appendChild(refreshIndicator);
    
    setTimeout(() => {
        refreshIndicator.remove();
    }, 2000);
    
    // Refresh filters and table
    if (window.filtersModule?.applyFilters) {
        window.filtersModule.applyFilters();
    }
}

function handleWindowResize() {
    const previousIsMobile = app.isMobile;
    const previousIsTablet = app.isTablet;
    
    // Update device detection
    detectDeviceType();
    
    // Handle device type changes
    if (previousIsMobile !== app.isMobile || previousIsTablet !== app.isTablet) {
        console.log(`📱 Device type changed: ${app.isMobile ? 'Mobile' : app.isTablet ? 'Tablet' : 'Desktop'}`);
        
        // Reinitialize table for new layout
        if (window.tableModule?.updateOrdersTable) {
            setTimeout(() => {
                window.tableModule.updateOrdersTable(window.filtersModule?.getFilteredOrders() || []);
            }, 100);
        }
        
        // Close any open mobile menus
        if (window.tableModule?.hideMobileMenu) {
            window.tableModule.hideMobileMenu();
        }
        
        // Reset any transform styles
        document.body.style.transform = '';
    }
    
    // Update CSS custom properties for responsive design
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}

function showWelcomeIfNeeded() {
    const hasSeenWelcome = localStorage.getItem('woodcraft_welcome_seen');
    
    if (!hasSeenWelcome) {
        setTimeout(() => {
            showNotification('success', 'Добро пожаловать в систему заказов WoodCraft! 🌟', 8000);
            localStorage.setItem('woodcraft_welcome_seen', 'true');
            
            // Show quick tips for mobile users
            if (app.isMobile) {
                setTimeout(() => {
                    showNotification('success', 'Совет: нажмите на заказ для просмотра деталей, свайпните вниз для обновления', 6000);
                }, 9000);
            }
        }, 1000);
    }
}

function showUserProfile() {
    // This would normally open a profile modal
    if (app.isMobile) {
        showNotification('success', 'Профиль пользователя (в разработке)');
    } else {
        const profileInfo = `
            <div class="profile-info">
                <h3>Профиль пользователя</h3>
                <div class="profile-details">
                    <p><strong>Имя:</strong> ${app.currentUser.name}</p>
                    <p><strong>Email:</strong> ${app.currentUser.email}</p>
                    <p><strong>Роль:</strong> Клиент</p>
                </div>
            </div>
        `;
        showNotification('success', 'Профиль пользователя (в разработке)');
    }
}

function handleLogout() {
    window.popupsModule?.showConfirmation(
        'Выход из системы',
        'Вы действительно хотите выйти?',
        () => {
            showLoading('Выход из системы...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }
    );
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
    
    if (app.initialized) {
        showNotification('error', 'Произошла ошибка. Попробуйте обновить страницу.');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unhandled promise rejection:', event.reason);
    
    if (app.initialized) {
        showNotification('error', 'Произошла ошибка при обработке запроса.');
    }
});

// Add global CSS for animations
const globalAnimationStyles = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-10px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-10px); }
    }
    
    .in-view {
        animation: slideInUp 0.6s ease forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    #skip-link:focus {
        top: 6px !important;
    }
`;

const globalStyleSheet = document.createElement('style');
globalStyleSheet.textContent = globalAnimationStyles;
document.head.appendChild(globalStyleSheet);

// Export main functions for global access
window.mainApp = {
    initialized: () => app.initialized,
    isMobile: () => app.isMobile,
    isTablet: () => app.isTablet,
    refreshData,
    showLoading,
    hideLoading,
    showUserProfile,
    handleLogout,
    currentUser: app.currentUser
};

// Global functions that need to be accessible from HTML
window.createNewOrder = () => window.popupsModule?.createNewOrder();
window.showFilters = () => window.filtersModule?.showFilters();
window.toggleUserMenu = () => {}; // Set in setupUserMenu
window.applyFilters = () => window.filtersModule?.applyFilters();
window.resetFilters = () => window.filtersModule?.resetFilters();
window.hideFilters = () => window.filtersModule?.hideFilters();
window.searchOrders = () => window.filtersModule?.searchOrders();
window.clearSearch = () => window.filtersModule?.clearSearch();
window.sortTable = (column) => window.tableModule?.sortTable(column);
window.goToPage = (page) => window.tableModule?.goToPage(page);
window.changeItemsPerPage = (value) => window.tableModule?.changeItemsPerPage(value);
window.exportOrders = () => window.tableModule?.exportOrders();
window.viewOrder = (id) => window.popupsModule?.viewOrder(id);
window.editOrder = (id) => window.popupsModule?.editOrder(id);
window.submitOrder = (id) => window.popupsModule?.submitOrder(id);
window.duplicateOrder = (id) => window.popupsModule?.duplicateOrder(id);
window.archiveOrder = (id) => window.popupsModule?.archiveOrder(id);
window.unarchiveOrder = (id) => window.popupsModule?.unarchiveOrder(id);
window.closeModal = (id) => window.popupsModule?.closeModal(id);
window.showNotification = (type, message, duration) => window.popupsModule?.showNotification(type, message, duration);
window.hideNotification = (id) => window.popupsModule?.hideNotification(id);

// Functions for form handling
window.switchTab = (tabName) => {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabName}')"]`)?.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`${tabName}Tab`)?.classList.add('active');
};

window.updateCharCounter = (input, counterId) => {
    const counter = document.getElementById(counterId);
    if (counter) {
        counter.textContent = input.value.length;
    }
};

window.addNewItem = () => {
    if (window.popupsModule?.addNewItem) {
        window.popupsModule.addNewItem();
    }
};

window.removeItem = (itemId) => {
    if (window.popupsModule?.removeItem) {
        window.popupsModule.removeItem(itemId);
    }
};

window.processBulkItems = () => {
    if (window.popupsModule?.processBulkItems) {
        window.popupsModule.processBulkItems();
    }
};

window.removeFile = (fileId) => {
    if (window.popupsModule?.removeFile) {
        window.popupsModule.removeFile(fileId);
    }
};

window.handleFinishChange = (select) => {
    const itemForm = select.closest('.item-form');
    const filmSelect = itemForm?.querySelector('.film-select');
    const paintSelect = itemForm?.querySelector('.paint-select');
    
    if (filmSelect) filmSelect.style.display = 'none';
    if (paintSelect) paintSelect.style.display = 'none';
    
    if (select.value === 'film' && filmSelect) {
        filmSelect.style.display = 'block';
    } else if (select.value === 'paint' && paintSelect) {
        paintSelect.style.display = 'block';
    }
    
    // Mark form as dirty if function exists
    if (window.markFormDirty) {
        window.markFormDirty();
    }
};

window.markFormDirty = () => {
    // This will be called from form inputs to mark form as changed
    if (window.popupsModule?.markFormDirty) {
        window.popupsModule.markFormDirty();
    }
};

window.saveOrder = () => {
    if (window.popupsModule?.saveOrder) {
        window.popupsModule.saveOrder();
    }
};

window.submitOrderFromForm = () => {
    if (window.popupsModule?.submitOrderFromForm) {
        window.popupsModule.submitOrderFromForm();
    }
};

// Mobile-specific functions
window.showMobileOrderMenu = (orderId) => {
    if (window.tableModule?.showMobileOrderMenu) {
        window.tableModule.showMobileOrderMenu(orderId);
    }
};

window.hideMobileMenu = () => {
    if (window.tableModule?.hideMobileMenu) {
        window.tableModule.hideMobileMenu();
    }
};

// Development helpers (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.dev = {
        app,
        modules: () => app.modules,
        demoData: () => window.demoData,
        filters: () => window.filtersModule?.getCurrentFilters(),
        performance: () => performance.getEntriesByType('navigation')[0],
        deviceInfo: () => ({
            isMobile: app.isMobile,
            isTablet: app.isTablet,
            width: window.innerWidth,
            height: window.innerHeight,
            userAgent: navigator.userAgent
        }),
        testNotifications: () => {
            showNotification('success', 'Тестовое уведомление успеха');
            setTimeout(() => showNotification('error', 'Тестовое уведомление ошибки'), 1000);
        },
        simulateError: () => {
            throw new Error('Тестовая ошибка для проверки обработчика');
        },
        clearWelcome: () => {
            localStorage.removeItem('woodcraft_welcome_seen');
            showNotification('success', 'Приветствие сброшено. Обновите страницу.');
        }
    };
    
    console.log('🔧 Development helpers available in window.dev');
    console.log('📱 Device type:', app.isMobile ? 'Mobile' : app.isTablet ? 'Tablet' : 'Desktop');
    console.log('📊 Performance timing available');
}