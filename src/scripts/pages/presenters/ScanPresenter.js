// src/scripts/pages/presenters/ScanPresenter.js

import ClassificationService from '../../services/ClassificationService';

class ScanPresenter {
    // recommendationView tetap dipertahankan agar tidak merusak struktur router bawaan,
    // meskipun nanti fungsinya bisa disesuaikan untuk saran penanganan jeruk.
    constructor(scanView, classificationView, recommendationView, appRouter) {
        this.scanView = scanView;
        this.classificationView = classificationView;
        this.recommendationView = recommendationView;
        this.appRouter = appRouter;
        
        this.scanView.presenter = this;
        this.classificationView.presenter = this;
    }

    init() {
        this.scanView.setFileHandler(this.handleFileSelected.bind(this));
        this.scanView.render();
    }

    handleFileSelected(file) {
        const reader = new FileReader();

        reader.onload = (event) => {
            const imageSrc = event.target.result;
            // Panggil metode klasifikasi YOLOv11
            this.classifyAndShowResult(imageSrc); 
        };

        reader.onerror = () => {
            this.classificationView.showError("Gagal memuat file gambar jeruk.");
        };

        reader.readAsDataURL(file);
    }

    async classifyAndShowResult(imageSrc) {
        try {
            // 1. Tampilkan indikator loading saat gambar dikirim ke Fly.io
            this.classificationView.showLoading();
            this.appRouter.navigateTo('classification');

            // 2. Kirim gambar ke backend FastAPI
            const result = await ClassificationService.classifyImage(imageSrc);

            // 3. Validasi berdasarkan format respons FastAPI dari YOLOv11
            // Respons yang diharapkan: { status: "success", label: "Matang", confidence_score: 0.95 }
            if (result && result.status === "success" && result.label) {
                console.log('Deteksi kematangan jeruk berhasil diproses di cloud.');

                // 4. Kirim gambar, label hasil, dan nilai konfidensi ke View untuk dirender
                this.classificationView.render(imageSrc, result.label, result.confidence_score);

            } else {
                throw new Error(result.message || 'Hasil deteksi tidak valid dari API.');
            }
        } catch (error) {
            console.error('Error saat melakukan deteksi:', error);
            this.classificationView.showError(error.message || 'Gagal mendeteksi tingkat kematangan jeruk.');
        }
    }
}

export default ScanPresenter;