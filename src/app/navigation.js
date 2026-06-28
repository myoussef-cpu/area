const TOOL_PAGES = [
    'cyclicQuadrilateral', 'divide_area', 'irregular_quadrilateral',
    'trapezoid', 'trapezoid_height_division', 'triangle',
    'circle_sector', 'regular_polygon', 'volumes_3d',
    'concrete_calc', 'land_leveling', 'all_tools', 'smart_tool',
    'settings', 'profile'
];

function updateUIState(page) {
    const items = document.querySelectorAll('.bottom-nav-item');

    let activeId = 'nav-main';

    if (page === 'calculator') activeId = 'nav-calc';
    else if (page === 'saved_results') activeId = 'nav-saved';
    else if (TOOL_PAGES.includes(page) || page === 'main' || page.includes('/')) activeId = 'nav-main';

    items.forEach((item) => {
        item.classList.remove('active');
        if (item.id === activeId) {
            item.classList.add('active');
        }
    });
}

async function navigateTo(page, params) {
    const mainContent = document.getElementById('main-content');
    const loading = document.getElementById('loading');
    const appTitle = document.getElementById('page-title');
    if (!loading || !mainContent) return;
    window.currentPageParams = params ?? null;
    window.forceHideSaved = false;

    const prevPage = window.location.hash.replace('#', '') || '';
    if (prevPage && prevPage !== page) window.saveSession(page);

    loading.style.display = 'flex';
    mainContent.style.opacity = '0';

    try {
        const pageUrl = page === 'main' ? 'ui/screens/main_screen.html' : page.includes('/') ? `ui/tools/${page}.html` : `ui/screens/${page}.html`;
        const response = await fetch(pageUrl);
        if (!response.ok) throw new Error('Page not found');

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const title = doc.querySelector('title');
        if (appTitle) appTitle.textContent = title ? title.textContent : 'تطبيق المساحات';

        updateUIState(page);

        const savedNavBtn = document.getElementById('nav-saved');
        if (savedNavBtn && !window.forceHideSaved) {
            savedNavBtn.style.setProperty('display', 'flex', 'important');
        }

        const bodyContent = doc.querySelector('body');
        let content = bodyContent ? bodyContent.innerHTML : html;

        mainContent.innerHTML = `<div class="page-enter">${content}</div>`;

        const scripts = doc.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            if (!oldScript.src) {
                newScript.textContent = oldScript.textContent;
            }
            document.body.appendChild(newScript);
            if (!oldScript.src) setTimeout(() => newScript.remove(), 100);
        });

        localStorage.setItem('lastPage', page);
        setTimeout(() => window.restoreSession(page), 150);

        window.history.pushState({page}, '', `#${page}`);
        mainContent.scrollTop = 0;

        if (window.ExportImage) {
            setTimeout(() => window.ExportImage.injectExportButtons(), 300);
        }

    } catch (error) {
        console.error('Navigation error:', error);
        mainContent.innerHTML = '<div class="card" style="text-align:center"><h3>حصل مشكلة في تحميل الصفحة</h3><button class="btn-main" onclick="navigateTo(\'main\')">ارجع للرئيسية</button></div>';
    } finally {
        setTimeout(() => {
            loading.style.display = 'none';
            mainContent.style.opacity = '1';
        }, 300);
    }
}

function goBack() {
    navigateTo('main');
}

export { updateUIState, navigateTo, goBack, TOOL_PAGES };
window.updateUIState = updateUIState;
window.navigateTo = navigateTo;
window.goBack = goBack;
