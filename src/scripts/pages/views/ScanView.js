// src/scripts/pages/views/ScanView.js (Versi Perbaikan)

import BaseView from './BaseView';

class ScanView extends BaseView {
    constructor(containerId) {
        super(containerId);
        this.fileHandler = null;
        this.eventsBound = false; // BARU: Tambahkan penanda
    }

    render() {
        this.container.innerHTML = `
            <div class="card scan-card">
                <div class="page-specific-header">
                    <div class="page-header-logo"><i class="fa-solid fa-citrus" style="color: orange;"></i> Jeruk Mandarin</div>
                    <div class="page-header-title">Scan Jeruk Mandarin</div>
                </div>
                <h2>Pilih gambar Jeruk untuk di-scan</h2>
                <div class="scan-option" id="camera-option">
                    <i class="fas fa-camera"></i>
                    <p>Gunakan Kamera</p>
                </div>
                <div class="scan-option" id="upload-option">
                    <i class="fas fa-upload"></i>
                    <p>Unggah Gambar dari Galeri</p>
                </div>
                <input type="file" id="file-input" accept="image/*" style="display: none;">
            </div>
        `;
        
        // DIUBAH: Panggil bindEvents hanya jika belum pernah dipanggil sebelumnya
        if (!this.eventsBound) {
            this.bindEvents();
            this.eventsBound = true; // Set penanda menjadi true
        }
    }

    bindEvents() {
        console.log("Mendaftarkan event listener untuk ScanView..."); // Pesan untuk debugging
        const fileInput = this.container.querySelector('#file-input');

        this.bind('click', '#camera-option', () => {
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        });

        this.bind('click', '#upload-option', () => {
            fileInput.removeAttribute('capture');
            fileInput.click();
        });

        this.bind('change', '#file-input', (event) => {
            if (this.fileHandler && event.target.files && event.target.files.length > 0) {
                const file = event.target.files[0];
                this.fileHandler(file);
            }
            // Reset value agar event 'change' bisa terpanggil lagi untuk file yang sama
            event.target.value = '';
        });
    }

    setFileHandler(handler) {
        this.fileHandler = handler;
    }
}

export default ScanView;