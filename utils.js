// ============================================================
// utils.js – دوال مساعدة متنوعة
// ============================================================

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes);
}

export function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key] || 'غير محدد';
        result[group] = result[group] || [];
        result[group].push(item);
        return result;
    }, {});
}

export function percentage(part, total) {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
}

export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 9999;
        background: var(--glass);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        color: var(--light);
        box-shadow: var(--shadow);
        animation: slideUp 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    if (type === 'success') {
        toast.style.borderColor = '#2ecc71';
        toast.querySelector('i').style.color = '#2ecc71';
    } else if (type === 'error') {
        toast.style.borderColor = 'var(--secondary)';
        toast.querySelector('i').style.color = 'var(--secondary)';
    } else {
        toast.style.borderColor = 'var(--primary)';
        toast.querySelector('i').style.color = 'var(--primary)';
    }
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function injectToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .toast {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}