/**
 * Dashboard Page
 */

let currentUser = null;
let spreadsheetLinks = [];
let currentLinkData = null;

async function createDashboardPage() {
    showLoading();
    
    try {
        currentUser = await api.getCurrentUser();
        
        if (!currentUser) {
            window.location.href = '/';
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = `
            <nav class="navbar">
                <div class="navbar-container">
                    <div class="navbar-brand">📊 Dashboard</div>
                    <div class="navbar-user">
                        <span>${currentUser.email}</span>
                        ${currentUser.picture ? `<img src="${currentUser.picture}" alt="User Avatar" class="user-avatar">` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="logoutUser()">Logout</button>
                    </div>
                </div>
            </nav>

            <div class="container">
                <div class="grid grid-cols-1">
                    <!-- Add Link Section -->
                    <div class="card">
                        <div class="card-header">
                            <h3>Tambah Spreadsheet Baru</h3>
                        </div>
                        <form id="add-link-form" onsubmit="handleAddLink(event)">
                            <div class="grid grid-cols-3" style="gap: 1rem;">
                                <div class="input-group">
                                    <label for="spreadsheet-url">URL Google Sheets*</label>
                                    <input 
                                        type="text" 
                                        id="spreadsheet-url" 
                                        placeholder="https://docs.google.com/spreadsheets/d/1A..."
                                        required
                                    >
                                </div>
                                <div class="input-group">
                                    <label for="sheet-name">Nama Sheet</label>
                                    <input 
                                        type="text" 
                                        id="sheet-name" 
                                        placeholder="Sheet1"
                                        value="Sheet1"
                                    >
                                </div>
                                <div class="input-group">
                                    <label for="link-name">Nama Link (Opsional)</label>
                                    <input 
                                        type="text" 
                                        id="link-name" 
                                        placeholder="Misal: Data Kelas A"
                                    >
                                </div>
                            </div>
                            <div class="card-footer" style="margin-top: 1rem;">
                                <button type="submit" class="btn btn-primary">Tambah Link</button>
                                <button type="button" class="btn btn-secondary" onclick="clearForm('add-link-form')">Bersihkan</button>
                            </div>
                        </form>
                    </div>

                    <!-- Links List -->
                    <div class="card">
                        <div class="card-header">
                            <h3>Daftar Spreadsheet Terhubung</h3>
                            <button class="btn btn-secondary btn-sm" onclick="refreshLinks()">Refresh</button>
                        </div>
                        <div id="links-list" style="min-height: 200px;">
                            <p style="text-align: center; color: var(--text-secondary);">Memuat...</p>
                        </div>
                    </div>

                    <!-- Data Preview -->
                    <div class="card" id="preview-section" style="display: none;">
                        <div class="card-header">
                            <h3>Data Hari Ini</h3>
                            <div>
                                <span id="data-date" style="color: var(--text-secondary); margin-right: 1rem;"></span>
                                <button class="btn btn-secondary btn-sm" onclick="refreshData()">Refresh Data</button>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table id="data-table">
                                <thead>
                                    <tr id="table-header"></tr>
                                </thead>
                                <tbody id="table-body">
                                </tbody>
                            </table>
                        </div>
                        <div id="no-data" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                            Tidak ada data untuk hari ini
                        </div>
                    </div>
                </div>
            </div>

            <footer class="footer">
                <p>&copy; 2025 Spreadsheet Data Reader. Dashboard untuk ${currentUser.email}</p>
            </footer>
        `;

        await refreshLinks();
        hideLoading();

    } catch (error) {
        hideLoading();
        Toaster.error('Error: ' + error.message);
    }
}

async function refreshLinks() {
    try {
        const data = await api.listSpreadsheetLinks();
        spreadsheetLinks = data.links || [];
        renderLinksList();
    } catch (error) {
        Toaster.error('Gagal memuat links: ' + error.message);
    }
}

function renderLinksList() {
    const container = document.getElementById('links-list');
    
    if (spreadsheetLinks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <p>Belum ada spreadsheet yang terhubung</p>
                <p style="font-size: 0.875rem;">Tambahkan link spreadsheet untuk memulai</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Nama Sheet</th>
                        <th>Sheet ID</th>
                        <th>Ditambahkan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${spreadsheetLinks.map(link => `
                        <tr>
                            <td>${link.spreadsheet_name || link.sheet_name}</td>
                            <td><code style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem;">${link.spreadsheet_id.substring(0, 16)}...</code></td>
                            <td>${formatDate(link.created_at)}</td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="loadLinkData(${link.id})">Lihat</button>
                                <button class="btn btn-danger btn-sm" onclick="deleteLink(${link.id})">Hapus</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function handleAddLink(event) {
    event.preventDefault();
    
    const url = document.getElementById('spreadsheet-url').value;
    const sheetName = document.getElementById('sheet-name').value || 'Sheet1';
    const linkName = document.getElementById('link-name').value;

    if (!url.trim()) {
        Toaster.error('Masukkan URL spreadsheet');
        return;
    }

    showLoading();
    
    try {
        await api.addSpreadsheetLink(url, sheetName, linkName);
        Toaster.success('Link spreadsheet berhasil ditambahkan!');
        clearForm('add-link-form');
        await refreshLinks();
    } catch (error) {
        Toaster.error('Error: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function loadLinkData(linkId) {
    showLoading();
    
    try {
        const link = spreadsheetLinks.find(l => l.id === linkId);
        if (link) {
            const result = await api.fetchSheetData(link.link, link.sheet_name);
            currentLinkData = result;
            renderDataPreview(result, link);
        }
    } catch (error) {
        Toaster.error('Gagal memuat data: ' + error.message);
    } finally {
        hideLoading();
    }
}

function renderDataPreview(data, link) {
    const previewSection = document.getElementById('preview-section');
    const dateDiv = document.getElementById('data-date');
    const noDataDiv = document.getElementById('no-data');
    const tableBody = document.getElementById('table-body');
    const tableHeader = document.getElementById('table-header');

    dateDiv.textContent = `📅 ${data.today || 'Data hari ini'}`;
    previewSection.style.display = 'block';

    if (!data.data || data.data.length === 0) {
        noDataDiv.style.display = 'block';
        tableBody.innerHTML = '';
        tableHeader.innerHTML = '';
        return;
    }

    noDataDiv.style.display = 'none';

    // Render table header
    const firstRow = data.data[0];
    const headers = Object.keys(firstRow);
    tableHeader.innerHTML = headers
        .map(h => `<th>${h}</th>`)
        .join('') + '<th>Aksi</th>';

    // Render table body
    tableBody.innerHTML = data.data
        .map((row, idx) => `
            <tr>
                ${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="copyToClipboard('${JSON.stringify(row).replace(/'/g, "&#39;")}')" title="Copy row">Copy</button>
                </td>
            </tr>
        `).join('');
}

async function deleteLink(linkId) {
    if (confirm('Apakah Anda yakin ingin menghapus link ini?')) {
        showLoading();
        
        try {
            await api.deleteSpreadsheetLink(linkId);
            Toaster.success('Link berhasil dihapus');
            await refreshLinks();
            document.getElementById('preview-section').style.display = 'none';
        } catch (error) {
            Toaster.error('Gagal menghapus link: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

async function refreshData() {
    if (currentLinkData) {
        // Reload current data
        const link = spreadsheetLinks[0]; // You should track which link is loaded
        if (link) {
            await loadLinkData(link.id);
        }
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    Toaster.success('Teks disalin ke clipboard');
}

async function logoutUser() {
    showLoading();
    
    try {
        await api.logout();
        window.location.href = '/';
    } catch (error) {
        hideLoading();
        Toaster.error('Gagal logout: ' + error.message);
    }
}
