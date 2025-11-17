/**
 * Error Page
 */

function createErrorPage(reason) {
    const app = document.getElementById('app');
    
    let errorTitle = 'Terjadi Kesalahan';
    let errorMessage = 'Maaf, ada masalah dengan permintaan Anda.';
    let errorIcon = '❌';

    if (reason === 'invalid_domain') {
        errorIcon = '🚫';
        errorTitle = 'Email Tidak Sesuai';
        errorMessage = 'Anda harus menggunakan email dengan domain @student.itera.ac.id untuk mengakses aplikasi ini.';
    }

    app.innerHTML = `
        <nav class="navbar">
            <div class="navbar-container">
                <div class="navbar-brand">📊 Spreadsheet Reader</div>
            </div>
        </nav>

        <div class="container">
            <div style="min-height: 600px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                <h1 style="font-size: 4rem; margin-bottom: 1rem;">${errorIcon}</h1>
                <h2>${errorTitle}</h2>
                <p style="font-size: 1.125rem; max-width: 500px; margin-bottom: 2rem;">${errorMessage}</p>
                
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="window.location.href = '/'">Kembali ke Halaman Utama</button>
                    <button class="btn btn-secondary" onclick="window.location.href = 'https://accounts.google.com/logout'">Logout Google</button>
                </div>
            </div>
        </div>

        <footer class="footer">
            <p>&copy; 2025 Spreadsheet Data Reader.</p>
        </footer>
    `;
}
