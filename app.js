// ============================================================
// app.js – التطبيق الرئيسي
// ============================================================

import authService from './auth.js';
import dataManager from './data-manager.js';
import uiRenderer from './ui-renderer.js';
import { showToast, injectToastStyles } from './utils.js';
import { initCharts, updateCharts } from './charts.js';
import { gameEngine } from './game-engine.js';
import { setupEventHandlers } from './events.js';

class App {
    constructor() {
        this.initialized = false;
    }

    async start() {
        if (this.initialized) return;
        this.initialized = true;

        injectToastStyles();
        uiRenderer.buildLayout();

        await authService.init();
        await dataManager.loadAll();
        dataManager.startListening();

        gameEngine.init();
        initCharts();
        setupEventHandlers();

        // تحديث الواجهة الأولية
        this._updateUI();

        dataManager.addListener((data) => {
            this._onDataUpdate(data);
        });

        authService.addListener((user) => {
            this._onUserUpdate(user);
        });

        if (!authService.currentUser) {
            setTimeout(() => {
                document.getElementById('loginModal')?.classList.add('open');
            }, 400);
        }

        console.log('✅ App started successfully');
        showToast('مرحباً بك في مدير كرة القدم!', 'success');
    }

    _onDataUpdate(data) {
        document.dispatchEvent(new CustomEvent('renderTables', { detail: data }));
        const stats = dataManager.getStats();
        uiRenderer.updateStats(stats);
        updateCharts(data);
        this._populateSelects(data);
        this._renderRecent(data);
    }

    _onUserUpdate(user) {
        uiRenderer.updateUserUI(user);
        if (user) {
            dataManager.loadAll().then(() => {
                document.dispatchEvent(new CustomEvent('renderTables', { detail: dataManager.data }));
            });
        }
    }

    _updateUI() {
        const data = dataManager.data;
        const user = authService.currentUser;
        uiRenderer.updateUserUI(user);
        const stats = dataManager.getStats();
        uiRenderer.updateStats(stats);
        document.dispatchEvent(new CustomEvent('renderTables', { detail: data }));
        this._populateSelects(data);
        this._renderRecent(data);
        updateCharts(data);
    }

    _populateSelects(data) {
        // Club select in player form
        const clubSelect = document.getElementById('pClub');
        if (clubSelect) {
            const curVal = clubSelect.value;
            clubSelect.innerHTML = '<option value="">اختر النادي</option>';
            data.clubs.forEach(c => {
                clubSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
            });
            clubSelect.value = curVal;
        }

        // Match selects
        const mTeam1 = document.getElementById('mTeam1');
        const mTeam2 = document.getElementById('mTeam2');
        const mTournament = document.getElementById('mTournament');
        [mTeam1, mTeam2].forEach(sel => {
            if (sel) {
                const cur = sel.value;
                sel.innerHTML = '<option value="">اختر</option>';
                data.clubs.forEach(c => {
                    sel.innerHTML += `<option value="${c.name}">${c.name}</option>`;
                });
                sel.value = cur;
            }
        });
        if (mTournament) {
            const cur = mTournament.value;
            mTournament.innerHTML = '<option value="">اختر</option>';
            data.tournaments.forEach(t => {
                mTournament.innerHTML += `<option value="${t.name}">${t.name}</option>`;
            });
            mTournament.value = cur;
        }

        // Tournament selects
        const tWinner = document.getElementById('tWinner');
        const tClubs = document.getElementById('tClubs');
        if (tWinner) {
            const cur = tWinner.value;
            tWinner.innerHTML = '<option value="">—</option>';
            data.clubs.forEach(c => {
                tWinner.innerHTML += `<option value="${c.name}">${c.name}</option>`;
            });
            tWinner.value = cur;
        }
        if (tClubs) {
            tClubs.innerHTML = '';
            data.clubs.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                tClubs.appendChild(opt);
            });
        }
    }

    _renderRecent(data) {
        const recentPlayers = document.getElementById('recentPlayers');
        const recentMatches = document.getElementById('recentMatches');
        const players = [...data.players].slice(-5).reverse();
        const matches = [...data.matches].slice(-5).reverse();

        if (recentPlayers) {
            if (players.length === 0) {
                recentPlayers.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>لا يوجد لاعبين</h3></div>';
            } else {
                recentPlayers.innerHTML = players.map(p =>
                    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--glass-border);">
                        <span>${p.name}</span>
                        <span class="text-gray">${p.club || '—'}</span>
                    </div>`
                ).join('');
            }
        }

        if (recentMatches) {
            if (matches.length === 0) {
                recentMatches.innerHTML = '<div class="empty-state"><i class="fas fa-futbol"></i><h3>لا يوجد مباريات</h3></div>';
            } else {
                recentMatches.innerHTML = matches.map(m =>
                    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--glass-border);">
                        <span>${m.team1} vs ${m.team2}</span>
                        <span class="text-gray">${m.score1} - ${m.score2}</span>
                    </div>`
                ).join('');
            }
        }
    }
}

// ===== تشغيل التطبيق =====
const app = new App();
document.addEventListener('DOMContentLoaded', () => {
    app.start();
});

window.app = app;