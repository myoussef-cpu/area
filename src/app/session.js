export function saveSession(page) {
    if (!page || page === 'login' || page === 'profile') return;
    const inputs = document.querySelectorAll(
        '#main-content input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="file"]):not([type="hidden"]), ' +
        '#main-content select, #main-content textarea'
    );
    if (inputs.length === 0) return;
    const state = {};
    inputs.forEach(el => {
        const key = el.id || el.name;
        if (!key) return;
        state[key] = (el.type === 'checkbox' || el.type === 'radio') ? el.checked : el.value;
    });
    if (Object.keys(state).length > 0) {
        localStorage.setItem(`formState_${page}`, JSON.stringify(state));
    }
}

export function restoreSession(page) {
    if (!page) return false;
    let data;
    try { data = JSON.parse(localStorage.getItem(`formState_${page}`)); } catch { return false; }
    if (!data) return false;
    const elements = [];
    Object.entries(data).forEach(([key, value]) => {
        const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (!el) return;
        elements.push(el);
        if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = !!value;
        } else {
            el.value = value;
        }
    });
    if (elements.length === 0) return false;
    elements.forEach(el => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return true;
}

window.saveSession = saveSession;
window.restoreSession = restoreSession;

const currentPage = window.location.hash.replace('#', '') || '';
if (currentPage) {
    saveSession(currentPage);
}
