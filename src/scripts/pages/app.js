// src/scripts/app.js

// Impor Views
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import ScanView from './views/ScanView';
import ClassificationView from './views/ClassificationView';
import HistoryView from './views/HistoryView';
import CreativeProductsView from './views/CreativeProductsView';
import CreativeProductsPresenter from './presenters/CreativeProductsPresenter';

// Impor Presenters
import AuthPresenter from './presenters/AuthPresenter';
import HistoryPresenter from './presenters/HistoryPresenter';

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
                    <li data-route="dashboard"><i class="fas fa-chart-line"></i> Dashboard</li>
                    <li data-route="scan"><i class="fas fa-camera"></i> Scan Jeruk</li>
                    

                    <li data-route="history"><i class="fas fa-history"></i> Riwayat Scan</li>
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
        this.dashboardView = new DashboardView('main-content-area');
        this.scanView = new ScanView('main-content-area');
        this.classificationView = new ClassificationView('main-content-area');
        this.historyView = new HistoryView('main-content-area');
        this.creativeProductsView = new CreativeProductsView('main-content-area');  

        this.authPresenter = new AuthPresenter(this.authView);
        this.historyPresenter = new HistoryPresenter(this.historyView);
        this.creativeProductsPresenter = new CreativeProductsPresenter(this.creativeProductsView);
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

        const submenuToggle = this.sideMenu.querySelector('.menu-toggle-submenu');
        if (submenuToggle) {
            submenuToggle.addEventListener('click', (event) => {
                event.preventDefault(); // Mencegah link berpindah halaman
                const parentLi = event.currentTarget.parentElement;
                parentLi.classList.toggle('open');
            });
        }

        this.logoutMenuItem.addEventListener('click', () => {
            AuthService.logout(() => console.log("Logout callback dijalankan."));
            this.toggleMenu(false);
        });
    }

    bindAuthEvents() {
        AuthService.on('login', (user) => {
            console.log('Event Login terdeteksi:', user);
            this.updateUIVisibility();
            this.navigateTo('dashboard');
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
            
            // Inisialisasi ScanPresenter setelah diimpor
            this.scanPresenter = new ScanPresenter(
                this.scanView, 
                this.classificationView, 
                this.recommendationView, 
                this
            );
            
            // DIUBAH: Hubungkan ClassificationView dengan presenter yang bertanggung jawab
            this.classificationView.presenter = this.scanPresenter;
            
            this.routes = {
                'auth': { presenter: this.authPresenter },
                'dashboard': { view: this.dashboardView },
                'scan': { presenter: this.scanPresenter },
                'history': { presenter: this.historyPresenter },
                'classification': { view: this.classificationView },
                'creative/:category': { presenter: this.creativeProductsPresenter }, 
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
        
        // --- LOGIKA BARU UNTUK RUTE DINAMIS ---
        let routeConfig;
        let routeParams = [];
        const pathParts = path.split('/'); // Memecah path, misal: 'creative/organik' -> ['creative', 'organik']
        const baseRoute = pathParts[0]; // Bagian pertama dari path, misal: 'creative'

        // Cek apakah ada rute dinamis yang cocok seperti 'creative/:category'
        if (pathParts.length > 1 && this.routes[`${baseRoute}/:category`]) {
            routeConfig = this.routes[`${baseRoute}/:category`];
            // Ambil bagian kedua dari path sebagai parameter
            routeParams.push(pathParts[1]); // Menangkap 'organik' atau 'nonorganik'
        } else {
            // Jika tidak, cari rute statis biasa
            routeConfig = this.routes[path];
        }
        // --- AKHIR LOGIKA BARU ---

        if (routeConfig) {
            // Hanya hapus konten jika navigasi ke rute yang benar-benar baru
            if (path !== currentHash) {
                mainContent.innerHTML = '';
            }
            
            // Gabungkan parameter dari URL dengan argumen lain
            const allArgs = [...routeParams, ...args];

            if (routeConfig.presenter) {
                routeConfig.presenter.init(...allArgs);
            } else if (routeConfig.view) {
                // Logika khusus untuk ClassificationView agar bisa menampilkan loading
                if (path === 'classification' && allArgs.length === 0) {
                    this.classificationView.showLoading();
                } else {
                    routeConfig.view.render(...allArgs);
                }
            }
            
            // Hanya update URL di history jika path-nya benar-benar baru
            if (path !== currentHash) {
                window.history.pushState({ path, args: allArgs }, '', `#${path}`);
            }
        } else {
            // Fallback jika rute tidak ditemukan sama sekali
            this.navigateTo(user ? 'dashboard' : 'auth');
        }
    }

    bindPopstateEvent() {
        window.addEventListener('popstate', (event) => {
            const path = event.state?.path || (AuthService.getCurrentUser() ? 'dashboard' : 'auth');
            this.navigateTo(path, ...(event.state?.args || []));
        });
    }

    handleInitialRoute() {
        const hash = window.location.hash.slice(1).split('?')[0];
        const user = AuthService.getCurrentUser();
        if (user) {
            this.navigateTo(hash && this.routes[hash] ? hash : 'dashboard');
        } else {
            this.navigateTo('auth');
        }
    }
}

export function initializeApp() {
    new AppRouter('app');
}