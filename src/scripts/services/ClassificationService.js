// src/scripts/services/ClassificationService.js

const API_BASE_URL = 'https://jerukmandarin-api.fly.dev/';

class ClassificationService {
    /**
     * Helper untuk 'tidur' selama beberapa milidetik.
     * @param {number} ms - Waktu tunggu dalam milidetik.
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async classifyImage(imageSrc) {
        console.log(`Mengirim gambar ke backend: ${API_BASE_URL}`);

        const maxRetries = 3; // Coba maksimal 3 kali
        const retryDelay = 2000; // Jeda 2 detik antar percobaan

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const fetchRes = await fetch(imageSrc);
                const blob = await fetchRes.blob();
                
                const formData = new FormData();
                formData.append('file', blob, 'image.jpg');

                const response = await fetch(`${API_BASE_URL}/predict`, {
                    method: 'POST',
                    body: formData,
                });

                if (response.status === 502 && attempt < maxRetries) {
                    // Jika Bad Gateway, server mungkin sedang bangun. Coba lagi.
                    console.warn(`Attempt ${attempt}: Server mengembalikan 502. Mencoba lagi dalam ${retryDelay}ms...`);
                    await this.sleep(retryDelay);
                    continue; // Lanjutkan ke iterasi loop berikutnya
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Gagal mendapatkan hasil klasifikasi dari API.');
                }

                const result = await response.json();
                console.log('Hasil diterima dari FastAPI:', result);
                return result; // Jika berhasil, keluar dari loop dan kembalikan hasil

            } catch (error) {
                console.error(`Attempt ${attempt} gagal:`, error);
                if (attempt >= maxRetries) {
                    // Jika semua percobaan gagal, teruskan error
                    throw new Error('Server tidak merespons setelah beberapa kali percobaan. Silakan coba lagi sesaat lagi.');
                }
                 await this.sleep(retryDelay); // Tunggu sebelum mencoba lagi
            }
        }
    }
}

export default new ClassificationService();