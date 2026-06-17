// src/scripts/pages/views/ClassificationView.js

import BaseView from './BaseView';

class ClassificationView extends BaseView {
    constructor(containerId) {
        super(containerId);
        // Presenter akan di-set oleh AppRouter
    }

    /**
     * Metode utama untuk menampilkan hasil klasifikasi yang berhasil.
     * @param {string} imageSrc - Sumber gambar yang di-scan (data URL).
     * @param {string} label - Tingkat kematangan hasil klasifikasi (misal, 'Matang').
     * @param {number} confidenceScore - Nilai akurasi prediksi YOLOv11 (0.0 - 1.0).
     */
    render(imageSrc, label, confidenceScore = 0) {
        // Pengecekan Pengaman
        if (!imageSrc || !label) {
            this.showLoading();
            return;
        }

        let recommendationText = 'Informasi lebih lanjut tidak tersedia.';
        
        // Penyesuaian saran berdasarkan tingkat kematangan jeruk
        switch (label.toLowerCase()) {
            case 'matang':
                recommendationText = 'Jeruk sudah matang sempurna, memiliki rasa manis optimal, dan siap untuk dipanen atau didistribusikan.';
                break;
            case 'setengah matang':
                recommendationText = 'Jeruk masih setengah matang. Disarankan untuk menunggu beberapa waktu lagi sebelum dipanen agar tingkat keasamannya menurun.';
                break;
            case 'mentah':
                recommendationText = 'Jeruk masih mentah dan belum siap dipanen. Biarkan tetap di pohon untuk proses pematangan alami.';
                break;
            case 'tidak ada jeruk terdeteksi':
                recommendationText = 'Sistem tidak menemukan buah jeruk pada gambar ini. Pastikan kamera menyorot buah dengan jelas.';
                break;
        }

        // Konversi skor ke format persentase yang mudah dibaca
        const persentaseAkurasi = (confidenceScore * 100).toFixed(2);

        this.container.innerHTML = `
            <div class="card classification-card">
                <div class="page-specific-header">
                    <div class="page-header-logo"><i class="fas fa-check-circle"></i> Hasil Deteksi</div>
                </div>
                <h2>Analisis YOLOv11 Selesai</h2>
                <div class="classification-result">
                    <img src="${imageSrc}" alt="Gambar objek yang dideteksi">
                    <p>Tingkat Kematangan: <strong style="font-size: 1.2em; color: #ff8c00;">${label.toUpperCase()}</strong></p>
                    <p>Confidence Score: <strong>${persentaseAkurasi}%</strong></p>
                    <p class="recommendation-text" style="margin-top: 10px; font-style: italic;">${recommendationText}</p>
                </div>
                <button class="btn" id="scan-again-btn" style="margin-top: 20px;">Scan Gambar Lain</button>
            </div>
        `;

        this.bindEvents();
    }

    showLoading() {
        this.container.innerHTML = `
            <div class="card classification-card">
                <div class="page-specific-header">
                    <div class="page-header-logo"><i class="fas fa-spinner fa-spin"></i> Memproses Cloud</div>
                </div>
                <h2>Menganalisis Gambar...</h2>
                <p>Harap tunggu, model YOLOv11 sedang mengkalkulasi tingkat kematangan jeruk.</p>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="card classification-card error-card">
                <div class="page-specific-header">
                    <div class="page-header-logo"><i class="fas fa-exclamation-triangle"></i> Terjadi Error</div>
                </div>
                <h2>Oops! Deteksi Gagal</h2>
                <p>${message}</p>
                <button class="btn" id="scan-again-btn">Coba Scan Lagi</button>
            </div>
        `;
        this.bindEvents();
    }

        bindEvents() {
                // Tombol "Scan Lagi"
                const scanAgainButton = this.container.querySelector('#scan-again-btn');
                if (scanAgainButton) {
                    this.bind('click', '#scan-again-btn', () => {
                        // Trik Jam 3 Pagi: Paksa rute ke halaman scan
                        window.location.hash = '#scan';
                        
                        // Lakukan pembersihan memori DOM dengan refresh halaman secara otomatis
                        // Ini meniru persis apa yang kamu lakukan secara manual, tapi terlihat instan!
                        window.location.reload();
                    });
                }
    }
}

export default ClassificationView;