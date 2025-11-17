/**
 * Landing Page
 */

function createLandingPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <nav class="navbar">
            <div class="navbar-container">
                <div class="navbar-brand">
                    📊 Spreadsheet Reader
                </div>
                <ul class="navbar-menu">
                    <li><a href="#login">Dokumentasi</a></li>
                    <li><a href="#about">Tentang</a></li>
                </ul>
            </div>
        </nav>

        <div class="container">
            <div style="min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">
                    Baca Data Google Spreadsheet dengan Mudah
                </h1>
                
                <p style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 2rem; max-width: 600px;">
                    Aplikasi profesional untuk membaca, memfilter, dan mengelola data dari Google Spreadsheet dengan antarmuka yang modern dan intuitif.
                </p>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem;">
                    <button class="btn btn-primary" onclick="loginWithGoogle()" style="padding: 0.75rem 2rem; font-size: 1.1rem;">
                        🔐 Login dengan Google
                    </button>
                    <button class="btn btn-secondary" onclick="showFeatures()" style="padding: 0.75rem 2rem; font-size: 1.1rem;">
                        Pelajari Lebih Lanjut
                    </button>
                </div>

                <div id="features" style="margin-top: 4rem;">
                    <!-- Features grid will be inserted here -->
                </div>
            </div>
        </div>

        <div style="background: var(--bg-secondary); padding: 3rem 0;">
            <div class="container">
                <div class="grid grid-cols-3">
                    <div class="card" style="text-align: center;">
                        <h3>🔐 Aman</h3>
                        <p>Autentikasi Google OAuth dengan validasi domain @student.itera.ac.id</p>
                    </div>
                    <div class="card" style="text-align: center;">
                        <h3>📱 Responsif</h3>
                        <p>Desain modern yang bekerja sempurna di desktop, tablet, dan mobile</p>
                    </div>
                    <div class="card" style="text-align: center;">
                        <h3>⚡ Cepat</h3>
                        <p>Memproses data dengan parsing tanggal yang robust dan caching</p>
                    </div>
                </div>
            </div>
        </div>

        <footer class="footer">
            <p>&copy; 2025 Spreadsheet Data Reader. Dibuat dengan ❤️ untuk ITERA.</p>
        </footer>
    `;

    document.getElementById('features').style.display = 'none';
}

async function loginWithGoogle() {
    showLoading();
    try {
        const authUrl = await api.loginGoogle();
        window.location.href = authUrl;
    } catch (error) {
        hideLoading();
        Toaster.error('Gagal memulai login: ' + error.message);
    }
}

function showFeatures() {
    const featuresDiv = document.getElementById('features');
    if (featuresDiv.style.display === 'none') {
        featuresDiv.style.display = 'block';
        featuresDiv.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 2rem;">Fitur Utama</h2>
            <div class="grid grid-cols-2">
                <div class="card">
                    <h4>📊 Baca Google Sheets</h4>
                    <p>Tautkan dan baca data dari Google Spreadsheet secara real-time</p>
                </div>
                <div class="card">
                    <h4>📅 Filter Tanggal Cerdas</h4>
                    <p>Otomatis memfilter baris berdasarkan tanggal hari ini dengan dukungan berbagai format</p>
                </div>
                <div class="card">
                    <h4>💾 Simpan & Kelola Link</h4>
                    <p>Simpan history spreadsheet yang digunakan dan akses dengan mudah kapan saja</p>
                </div>
                <div class="card">
                    <h4>📈 Dashboard Interaktif</h4>
                    <p>Tampilkan data dalam tabel modern dengan sorting, filtering, dan export</p>
                </div>
            </div>
        `;
    } else {
        featuresDiv.style.display = 'none';
    }
}
