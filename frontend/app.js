/**
 * Main Application Router
 */

document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const params = getQueryParams();

    if (path === '/' || path === '/index.html') {
        createLandingPage();
    } else if (path === '/dashboard') {
        await createDashboardPage();
    } else if (path === '/error') {
        createErrorPage(params.reason);
    } else {
        // Check if user is authenticated
        const user = await api.getCurrentUser();
        if (user) {
            window.location.href = '/dashboard';
        } else {
            window.location.href = '/';
        }
    }
});

// Handle page navigation
function navigateTo(path) {
    window.history.pushState(null, '', path);
    window.location.href = path;
}
