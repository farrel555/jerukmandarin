// src/scripts/app.js

// Impor Views
import AuthView from './views/AuthView';
import ScanView from './views/ScanView';
import ClassificationView from './views/ClassificationView';

// Impor Presenters
import AuthPresenter from './presenters/AuthPresenter';

// Impor Services
import AuthService from '../services/AuthService'; 

class AppRouter {
    constructor(appContainerId) {
        this.appContainer = document.getElementById(appContainerId);
        if (!this.appContainer) {
            console.error(`Elemen dengan ID '${appContainerId}' tidak ditemukan.`);
            return;
        }

        this.routes = {};
        this.currentPresenter = null;

        this.renderGlobalLayout();
        this.setupElements();
        this.setupViewsAndPresenters();
        
        AuthService.init();
        this.bindAuthEvents();
        this.bindGlobalEvents();
        
        this.setupRoutes(); // Ini bersifat async
        this.bindPopstateEvent();
        
        this.updateUIVisibility();
    }

    renderGlobalLayout() {
        this.appContainer.innerHTML = `
            <header class="app-header">
                <div class="header-left-content">
                    <button id="menu-toggle-btn" class="menu-button"><i class="fas fa-bars"></i></button>
                    <div class="app-logo-text"><i class="fas fa-recycle"></i> JerukMandarin</div>
                </div>
                <div class="header-right-content"></div>
            </header>
            <div id="side-menu" class="side-menu">
                <div class="menu-header">
                    <div class="logo-text"><i class="fas fa-recycle"></i> JerukMandarin</div>
                    <button id="menu-close-btn" class="menu-button"><i class="fas fa-times"></i></button>
                </div>
                <ul class="menu-items">
                    <li data-route="scan"><i class="fas fa-camera"></i> Scan Jeruk</li>
                    <li id="logout-menu-item"><i class="fas fa-sign-out-alt"></i> Logout</li>
                </ul>
            </div>
            <div id="menu-overlay" class="menu-overlay"></div>
            <main id="main-content-area" class="main-content"></main>
        `;
    }

    setupElements() {
        this.menuToggleBtn = document.getElementById('menu-toggle-btn');
        this.menuCloseBtn = document.getElementById('menu-close-btn');
        this.sideMenu = document.getElementById('side-menu');
        this.menuOverlay = document.getElementById('menu-overlay');
        this.logoutMenuItem = document.getElementById('logout-menu-item');
    }

    setupViewsAndPresenters() {
        this.authView = new AuthView('main-content-area');
        this.scanView = new ScanView('main-content-area');
        this.classificationView = new ClassificationView('main-content-area');

        this.authPresenter = new AuthPresenter(this.authView);
    }

    bindGlobalEvents() {
        this.menuToggleBtn.addEventListener('click', () => this.toggleMenu(true));
        this.menuCloseBtn.addEventListener('click', () => this.toggleMenu(false));
        this.menuOverlay.addEventListener('click', () => this.toggleMenu(false));

        this.sideMenu.querySelectorAll('.menu-items li[data-route]').forEach(item => {
            item.addEventListener('click', (event) => {
                this.navigateTo(event.currentTarget.dataset.route);
                this.toggleMenu(false);
            });
        });

        this.logoutMenuItem.addEventListener('click', () => {
            AuthService.logout(() => console.log("Logout callback dijalankan."));
            this.toggleMenu(false);
        });
    }

    bindAuthEvents() {
        AuthService.on('login', (user) => {
            console.log('Event Login terdeteksi:', user);
            this.updateUIVisibility();
            this.navigateTo('scan'); // Default dialihkan ke scan
        });

        AuthService.on('logout', () => {
            console.log('Event Logout terdeteksi.');
            this.updateUIVisibility();
            this.navigateTo('auth');
        });
    }
    
    updateUIVisibility() {
        const user = AuthService.getCurrentUser();
        if (user) {
            this.menuToggleBtn.style.display = 'block';
            this.logoutMenuItem.style.display = 'flex';
        } else {
            this.menuToggleBtn.style.display = 'none';
            this.sideMenu.classList.remove('open');
            this.menuOverlay.classList.remove('open');
            this.logoutMenuItem.style.display = 'none';
        }
    }

    toggleMenu(open) {
        if (open) {
            this.sideMenu.classList.add('open');
            this.menuOverlay.classList.add('open');
        } else {
            this.sideMenu.classList.remove('open');
            this.menuOverlay.classList.remove('open');
        }
    }

    async setupRoutes() {
        try {
            const { default: ScanPresenter } = await import('./presenters/ScanPresenter');
            
            // Catatan: this.recommendationView sebelumnya digunakan di sini tapi tidak diinisialisasi.
            // Saya menggantinya dengan null agar jumlah parameter tetap valid sesuai kode asli Anda.
            this.scanPresenter = new ScanPresenter(
                this.scanView, 
                this.classificationView, 
                null, 
                this
            );
            
            this.classificationView.presenter = this.scanPresenter;
            
            this.routes = {
                'auth': { presenter: this.authPresenter },
                'scan': { presenter: this.scanPresenter },
                'classification': { view: this.classificationView }
            };

            this.handleInitialRoute();
        } catch (error) {
            console.error("Gagal memuat presenter:", error);
        }
    }

    navigateTo(path, ...args) {
        const user = AuthService.getCurrentUser();
        if (!user && path !== 'auth') {
            this.navigateTo('auth');
            return;
        }

        const mainContent = this.appContainer.querySelector('#main-content-area');
        const currentHash = window.location.hash.slice(1);
        
        // Logika routing telah disederhanakan karena tidak ada rute dinamis (creative/:category) lagi
        const routeConfig = this.routes[path];

        if (routeConfig) {
            if (path !== currentHash) {
                mainContent.innerHTML = '';
            }
            
            if (routeConfig.presenter) {
                routeConfig.presenter.init(...args);
            } else if (routeConfig.view) {
                if (path === 'classification' && args.length === 0) {
                    this.classificationView.showLoading();
                } else {
                    routeConfig.view.render(...args);
                }
            }
            
            if (path !== currentHash) {
                window.history.pushState({ path, args }, '', `#${path}`);
            }
        } else {
            // Fallback jika rute tidak ditemukan diarahkan ke scan
            this.navigateTo(user ? 'scan' : 'auth');
        }
    }

    bindPopstateEvent() {
        window.addEventListener('popstate', (event) => {
            const path = event.state?.path || (AuthService.getCurrentUser() ? 'scan' : 'auth');
            this.navigateTo(path, ...(event.state?.args || []));
        });
    }

    handleInitialRoute() {
        const hash = window.location.hash.slice(1).split('?')[0];
        const user = AuthService.getCurrentUser();
        if (user) {
            this.navigateTo(hash && this.routes[hash] ? hash : 'scan');
        } else {
            this.navigateTo('auth');
        }
    }
}

export function initializeApp() {
    new AppRouter('app');
}