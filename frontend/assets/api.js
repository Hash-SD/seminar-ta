/**
 * API Client for Backend Communication
 */

class APIClient {
    constructor(baseURL = 'http://localhost:8000/api') {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Generic fetch wrapper
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.headers,
                    ...options.headers,
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'API Error');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async loginGoogle() {
        const data = await this.request('/auth/login');
        return data.url;
    }

    async getCurrentUser() {
        try {
            return await this.request('/auth/me');
        } catch (error) {
            return null;
        }
    }

    async logout() {
        return await this.request('/auth/logout', { method: 'GET' });
    }

    // Spreadsheet endpoints
    async fetchSheetData(spreadsheetLink, sheetName = 'Sheet1') {
        return await this.request('/sheets/fetch', {
            method: 'POST',
            body: JSON.stringify({
                spreadsheet_link: spreadsheetLink,
                sheet_name: sheetName,
            }),
        });
    }

    async testDateParser(dateString) {
        return await this.request(`/sheets/test-date-parser?date_string=${encodeURIComponent(dateString)}`);
    }

    // Link management endpoints
    async addSpreadsheetLink(spreadsheetLink, sheetName = 'Sheet1', name = '') {
        return await this.request('/links/add', {
            method: 'POST',
            body: JSON.stringify({
                spreadsheet_link: spreadsheetLink,
                sheet_name: sheetName,
                name: name,
            }),
        });
    }

    async listSpreadsheetLinks() {
        return await this.request('/links/list');
    }

    async deleteSpreadsheetLink(linkId) {
        return await this.request(`/links/delete/${linkId}`, { method: 'DELETE' });
    }

    async getLinkHistory(linkId) {
        return await this.request(`/links/history/${linkId}`);
    }
}

// Global API client instance
const api = new APIClient();
