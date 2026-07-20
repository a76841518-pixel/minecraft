// ============================================================
// events.js – معالجات الأحداث (النسخة الكاملة)
// ============================================================

import authService from './auth.js';
import dataManager from './data-manager.js';
import uiRenderer from './ui-renderer.js';
import { showToast } from './utils.js';
import { gameEngine } from './game-engine.js';

export function setupEventHandlers() {
    // ===== التنقل =====
    const navLinks = uiRenderer.getNavLinks();
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            uiRenderer.activateSection(section);
            if (section === 'game') {
                document.getElementById('gameStartScreen').style.display = 'block';
                document.getElementById('gamePlayScreen').style.display = 'none';
                document.getElementById('gameResultScreen').style.display = 'none';
            }
        });
    });

    // ===== مزامنة البيانات =====
    document.getElementById('syncDataBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('syncDataBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري...';
        try {
            await dataManager.loadAll();
            showToast('✅ تمت المزامنة بنجاح', 'success');
        } catch (e) {
            showToast('❌ خطأ في المزامنة: ' + e.message, 'error');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync"></i> مزامنة';
    });

    // ===== حدث تحديث الجداول =====
    document.addEventListener('renderTables', (e) => {
        const data = e.detail;
        renderPlayersTable(data);
        renderClubsTable(data);
        renderMatchesTable(data);
        renderTournamentsTable(data);
        renderQuestionsTable(data);
        renderLeaderboard(data);
    });

    // ===== الإعدادات =====
    setupSettingsHandlers();

    // ===== تسجيل الدخول والتسجيل =====
    setupAuthHandlers();

    // ===== نماذج الإضافة والتعديل =====
    setupCRUDHandlers();

    // ===== البحث والفلاتر =====
    setupSearchHandlers();

    // ===== تبديل الثيم =====
    setupThemeToggle();

    // ===== إغلاق المودالات عند النقر خارجها =====
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    });
}

// ============================================================
// دوال عرض الجداول (مكتملة)
// ============================================================

function renderPlayersTable(data) {
    const tbody = document.getElementById('playersTableBody');
    if (!tbody) return;
    const search = document.getElementById('searchPlayer')?.value?.toLowerCase() || '';
    const posFilter = document.getElementById('filterPlayerPosition')?.value || '';
    let list = data.players || [];
    if (search) list = list.filter(p => p.name?.toLowerCase().includes(search) || p.club?.toLowerCase().includes(search));
    if (posFilter) list = list.filter(p => p.position === posFilter);
    const total = list.length;
    const page = parseInt(localStorage.getItem('playerPage') || '1');
    const size = 8;
    const start = (page - 1) * size;
    const paginated = list.slice(start, start + size);
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-gray">لا يوجد لاعبين</td></tr>`;
    } else {
        let html = '';
        paginated.forEach((p, idx) => {
            const clubName = data.clubs?.find(c => c.name === p.club)?.name || p.club || '—';
            const img = p.image ? `<img src="${p.image}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="">` : '—';
            html += `<tr>
                <td>${start + idx + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${clubName}</td>
                <td><span class="badge badge-primary">${p.position || '—'}</span></td>
                <td>${p.age || '—'}</td>
                <td>${p.nationality || '—'}</td>
                <td>⚽ ${p.goals || 0}</td>
                <td>${img}</td>
                <td>
                    <div class="table-actions">
                        ${authService.checkPermission('editor') ? `
                        <button class="btn btn-sm btn-primary" onclick="window.editPlayer('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="window.deletePlayer('${p.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
    document.getElementById('playerCount').textContent = `${total} لاعب`;
    renderPagination('playerPagination', total, page, (p) => { localStorage.setItem('playerPage', p);
        renderPlayersTable(data); });
}

function renderClubsTable(data) {
    const tbody = document.getElementById('clubsTableBody');
    if (!tbody) return;
    const search = document.getElementById('searchClub')?.value?.toLowerCase() || '';
    let list = data.clubs || [];
    if (search) list = list.filter(c => c.name?.toLowerCase().includes(search) || c.city?.toLowerCase().includes(search) || c.league?.toLowerCase().includes(search));
    const total = list.length;
    const page = parseInt(localStorage.getItem('clubPage') || '1');
    const size = 8;
    const start = (page - 1) * size;
    const paginated = list.slice(start, start + size);
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray">لا يوجد أندية</td></tr>`;
    } else {
        let html = '';
        paginated.forEach((c, idx) => {
            const logo = c.logo ? `<img src="${c.logo}" style="width:32px;height:32px;object-fit:contain;" alt="">` : '—';
            html += `<tr>
                <td>${start + idx + 1}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.city || '—'}</td>
                <td>${c.league || '—'}</td>
                <td>${c.founded || '—'}</td>
                <td>${logo}</td>
                <td>
                    <div class="table-actions">
                        ${authService.checkPermission('editor') ? `
                        <button class="btn btn-sm btn-primary" onclick="window.editClub('${c.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteClub('${c.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
    document.getElementById('clubCount').textContent = `${total} نادي`;
    renderPagination('clubPagination', total, page, (p) => { localStorage.setItem('clubPage', p);
        renderClubsTable(data); });
}

function renderMatchesTable(data) {
    const tbody = document.getElementById('matchesTableBody');
    if (!tbody) return;
    const search = document.getElementById('searchMatch')?.value?.toLowerCase() || '';
    let list = data.matches || [];
    if (search) list = list.filter(m => m.team1?.toLowerCase().includes(search) || m.team2?.toLowerCase().includes(search) || m.tournament?.toLowerCase().includes(search));
    const total = list.length;
    const page = parseInt(localStorage.getItem('matchPage') || '1');
    const size = 8;
    const start = (page - 1) * size;
    const paginated = list.slice(start, start + size);
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray">لا يوجد مباريات</td></tr>`;
    } else {
        let html = '';
        paginated.forEach((m, idx) => {
            html += `<tr>
                <td>${start + idx + 1}</td>
                <td>${m.team1}</td>
                <td>${m.team2}</td>
                <td>${m.score1} - ${m.score2}</td>
                <td>${m.date || '—'}</td>
                <td>${m.tournament || '—'}</td>
                <td>
                    <div class="table-actions">
                        ${authService.checkPermission('editor') ? `
                        <button class="btn btn-sm btn-primary" onclick="window.editMatch('${m.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteMatch('${m.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
    document.getElementById('matchCount').textContent = `${total} مباراة`;
    renderPagination('matchPagination', total, page, (p) => { localStorage.setItem('matchPage', p);
        renderMatchesTable(data); });
}

function renderTournamentsTable(data) {
    const tbody = document.getElementById('tournamentsTableBody');
    if (!tbody) return;
    const search = document.getElementById('searchTournament')?.value?.toLowerCase() || '';
    let list = data.tournaments || [];
    if (search) list = list.filter(t => t.name?.toLowerCase().includes(search) || (t.winner && t.winner.toLowerCase().includes(search)));
    const total = list.length;
    const page = parseInt(localStorage.getItem('tournamentPage') || '1');
    const size = 8;
    const start = (page - 1) * size;
    const paginated = list.slice(start, start + size);
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray">لا يوجد بطولات</td></tr>`;
    } else {
        let html = '';
        paginated.forEach((t, idx) => {
            html += `<tr>
                <td>${start + idx + 1}</td>
                <td><strong>${t.name}</strong></td>
                <td>${t.year || '—'}</td>
                <td>${t.winner || '—'}</td>
                <td>${(t.clubs || []).join('، ') || '—'}</td>
                <td>
                    <div class="table-actions">
                        ${authService.checkPermission('editor') ? `
                        <button class="btn btn-sm btn-primary" onclick="window.editTournament('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteTournament('${t.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
    document.getElementById('tournamentCount').textContent = `${total} بطولة`;
    renderPagination('tournamentPagination', total, page, (p) => { localStorage.setItem('tournamentPage', p);
        renderTournamentsTable(data); });
}

function renderQuestionsTable(data) {
    const tbody = document.getElementById('questionsTableBody');
    if (!tbody) return;
    const search = document.getElementById('searchQuestion')?.value?.toLowerCase() || '';
    const catFilter = document.getElementById('filterQuestionCategory')?.value || '';
    let list = data.questions || [];
    if (search) list = list.filter(q => q.question?.toLowerCase().includes(search));
    if (catFilter) list = list.filter(q => q.category === catFilter);
    const total = list.length;
    const page = parseInt(localStorage.getItem('questionPage') || '1');
    const size = 8;
    const start = (page - 1) * size;
    const paginated = list.slice(start, start + size);
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray">لا يوجد أسئلة</td></tr>`;
    } else {
        let html = '';
        paginated.forEach((q, idx) => {
            const diffColor = q.difficulty === 'سهل' ? 'badge-success' : q.difficulty === 'صعب' ? 'badge-danger' : 'badge-warning';
            html += `<tr>
                <td>${start + idx + 1}</td>
                <td>${q.question}</td>
                <td><span class="badge badge-primary">${q.category || 'عام'}</span></td>
                <td><span class="badge ${diffColor}">${q.difficulty || 'متوسط'}</span></td>
                <td>
                    <div class="table-actions">
                        ${authService.checkPermission('editor') ? `
                        <button class="btn btn-sm btn-primary" onclick="window.editQuestion('${q.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteQuestion('${q.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }
    document.getElementById('questionCount').textContent = `${total} سؤال`;
    renderPagination('questionPagination', total, page, (p) => { localStorage.setItem('questionPage', p);
        renderQuestionsTable(data); });
}

function renderLeaderboard(data) {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    const lb = data.leaderboard || [];
    if (lb.length === 0) {
        list.innerHTML = '<div class="text-gray">لا توجد نتائج بعد</div>';
        return;
    }
    const sorted = [...lb].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
    list.innerHTML = sorted.map((item, idx) =>
        `<div class="lb-item"><span><span class="lb-rank">#${idx+1}</span> ${item.name || 'مجهول'}</span><span>⭐ ${item.score || 0}</span></div>`
    ).join('');
}

function renderPagination(containerId, total, currentPage, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const totalPages = Math.ceil(total / 8);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    container.innerHTML = html;
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page !== currentPage) callback(page);
        });
    });
}

// ============================================================
// دوال التعديل والحذف (النسخة الكاملة)
// ============================================================

// ---- Player ----
window.editPlayer = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    const player = dataManager.data.players.find(p => p.id === id);
    if (!player) return showToast('اللاعب غير موجود', 'error');
    openEditModal('player', player, 'playerFormId', 'playerModalTitle', 'تعديل لاعب');
};

window.deletePlayer = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    if (!confirm('هل أنت متأكد من حذف هذا اللاعب؟')) return;
    try {
        await dataManager.delete('players', id);
        showToast('✅ تم حذف اللاعب بنجاح', 'success');
    } catch (err) {
        showToast('❌ خطأ في الحذف: ' + err.message, 'error');
    }
};

// ---- Club ----
window.editClub = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    const club = dataManager.data.clubs.find(c => c.id === id);
    if (!club) return showToast('النادي غير موجود', 'error');
    openEditModal('club', club, 'clubFormId', 'clubModalTitle', 'تعديل نادي');
};

window.deleteClub = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    if (!confirm('هل أنت متأكد من حذف هذا النادي؟')) return;
    try {
        await dataManager.delete('clubs', id);
        showToast('✅ تم حذف النادي بنجاح', 'success');
    } catch (err) {
        showToast('❌ خطأ في الحذف: ' + err.message, 'error');
    }
};

// ---- Match ----
window.editMatch = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    const match = dataManager.data.matches.find(m => m.id === id);
    if (!match) return showToast('المباراة غير موجودة', 'error');
    openEditModal('match', match, 'matchFormId', 'matchModalTitle', 'تعديل مباراة');
};

window.deleteMatch = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    if (!confirm('هل أنت متأكد من حذف هذه المباراة؟')) return;
    try {
        await dataManager.delete('matches', id);
        showToast('✅ تم حذف المباراة بنجاح', 'success');
    } catch (err) {
        showToast('❌ خطأ في الحذف: ' + err.message, 'error');
    }
};

// ---- Tournament ----
window.editTournament = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    const tournament = dataManager.data.tournaments.find(t => t.id === id);
    if (!tournament) return showToast('البطولة غير موجودة', 'error');
    openEditModal('tournament', tournament, 'tournamentFormId', 'tournamentModalTitle', 'تعديل بطولة');
};

window.deleteTournament = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    if (!confirm('هل أنت متأكد من حذف هذه البطولة؟')) return;
    try {
        await dataManager.delete('tournaments', id);
        showToast('✅ تم حذف البطولة بنجاح', 'success');
    } catch (err) {
        showToast('❌ خطأ في الحذف: ' + err.message, 'error');
    }
};

// ---- Question ----
window.editQuestion = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    const question = dataManager.data.questions.find(q => q.id === id);
    if (!question) return showToast('السؤال غير موجود', 'error');
    openEditModal('question', question, 'qFormId', 'questionModalTitle', 'تعديل سؤال');
};

window.deleteQuestion = async (id) => {
    if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
        await dataManager.delete('questions', id);
        showToast('✅ تم حذف السؤال بنجاح', 'success');
    } catch (err) {
        showToast('❌ خطأ في الحذف: ' + err.message, 'error');
    }
};

// ---- دالة مساعدة لفتح مودال التعديل ----
function openEditModal(type, item, idFieldId, titleId, titleText) {
    document.getElementById(titleId).textContent = titleText;
    document.getElementById(idFieldId).value = item.id;

    // تعبئة الحقول حسب النوع
    switch (type) {
        case 'player':
            document.getElementById('pName').value = item.name || '';
            document.getElementById('pClub').value = item.club || '';
            document.getElementById('pPosition').value = item.position || '';
            document.getElementById('pAge').value = item.age || '';
            document.getElementById('pNationality').value = item.nationality || '';
            document.getElementById('pNumber').value = item.number || '';
            document.getElementById('pGoals').value = item.goals || 0;
            document.getElementById('pAssists').value = item.assists || 0;
            document.getElementById('pImage').value = item.image || '';
            document.getElementById('playerModal').classList.add('open');
            // تغيير سلوك النموذج للتحديث
            document.getElementById('playerForm').dataset.mode = 'update';
            document.getElementById('playerForm').dataset.id = item.id;
            break;

        case 'club':
            document.getElementById('cName').value = item.name || '';
            document.getElementById('cCity').value = item.city || '';
            document.getElementById('cLeague').value = item.league || '';
            document.getElementById('cFounded').value = item.founded || '';
            document.getElementById('cLogo').value = item.logo || '';
            document.getElementById('clubModal').classList.add('open');
            document.getElementById('clubForm').dataset.mode = 'update';
            document.getElementById('clubForm').dataset.id = item.id;
            break;

        case 'match':
            document.getElementById('mTeam1').value = item.team1 || '';
            document.getElementById('mTeam2').value = item.team2 || '';
            document.getElementById('mScore1').value = item.score1 || 0;
            document.getElementById('mScore2').value = item.score2 || 0;
            document.getElementById('mDate').value = item.date || '';
            document.getElementById('mTournament').value = item.tournament || '';
            document.getElementById('matchModal').classList.add('open');
            document.getElementById('matchForm').dataset.mode = 'update';
            document.getElementById('matchForm').dataset.id = item.id;
            break;

        case 'tournament':
            document.getElementById('tName').value = item.name || '';
            document.getElementById('tYear').value = item.year || '';
            document.getElementById('tWinner').value = item.winner || '';
            const clubsSelect = document.getElementById('tClubs');
            Array.from(clubsSelect.options).forEach(opt => {
                opt.selected = (item.clubs || []).includes(opt.value);
            });
            document.getElementById('tournamentModal').classList.add('open');
            document.getElementById('tournamentForm').dataset.mode = 'update';
            document.getElementById('tournamentForm').dataset.id = item.id;
            break;

        case 'question':
            document.getElementById('qText').value = item.question || '';
            document.getElementById('qOpt1').value = item.options[0] || '';
            document.getElementById('qOpt2').value = item.options[1] || '';
            document.getElementById('qOpt3').value = item.options[2] || '';
            document.getElementById('qOpt4').value = item.options[3] || '';
            document.getElementById('qCorrect').value = item.correct || 0;
            document.getElementById('qDifficulty').value = item.difficulty || 'متوسط';
            document.getElementById('qCategory').value = item.category || 'عام';
            document.getElementById('questionModal').classList.add('open');
            document.getElementById('questionForm').dataset.mode = 'update';
            document.getElementById('questionForm').dataset.id = item.id;
            break;
    }
}

// ============================================================
// معالجات نماذج CRUD (إضافة وتعديل)
// ============================================================

function setupCRUDHandlers() {
    // ---- نموذج اللاعب ----
    document.getElementById('playerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
        const form = e.target;
        const id = form.dataset.id || document.getElementById('playerFormId').value;
        const data = {
            name: document.getElementById('pName').value.trim(),
            club: document.getElementById('pClub').value,
            position: document.getElementById('pPosition').value,
            age: parseInt(document.getElementById('pAge').value),
            nationality: document.getElementById('pNationality').value.trim(),
            number: parseInt(document.getElementById('pNumber').value) || 0,
            goals: parseInt(document.getElementById('pGoals').value) || 0,
            assists: parseInt(document.getElementById('pAssists').value) || 0,
            image: document.getElementById('pImage').value.trim(),
        };
        if (!data.name || !data.club || !data.position || !data.age) {
            return showToast('يرجى ملء الحقول المطلوبة (*)', 'error');
        }
        try {
            if (id && form.dataset.mode === 'update') {
                await dataManager.update('players', id, data);
                showToast('✅ تم التحديث بنجاح', 'success');
            } else {
                await dataManager.add('players', data);
                showToast('✅ تم الإضافة بنجاح', 'success');
            }
            document.getElementById('playerModal').classList.remove('open');
            form.dataset.mode = '';
            form.dataset.id = '';
            form.reset();
        } catch (err) {
            showToast('❌ خطأ: ' + err.message, 'error');
        }
    });

    // ---- نموذج النادي ----
    document.getElementById('clubForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
        const form = e.target;
        const id = form.dataset.id || document.getElementById('clubFormId').value;
        const data = {
            name: document.getElementById('cName').value.trim(),
            city: document.getElementById('cCity').value.trim(),
            league: document.getElementById('cLeague').value.trim(),
            founded: parseInt(document.getElementById('cFounded').value) || null,
            logo: document.getElementById('cLogo').value.trim(),
        };
        if (!data.name) return showToast('يرجى إدخال اسم النادي', 'error');
        try {
            if (id && form.dataset.mode === 'update') {
                await dataManager.update('clubs', id, data);
                showToast('✅ تم التحديث بنجاح', 'success');
            } else {
                await dataManager.add('clubs', data);
                showToast('✅ تم الإضافة بنجاح', 'success');
            }
            document.getElementById('clubModal').classList.remove('open');
            form.dataset.mode = '';
            form.dataset.id = '';
            form.reset();
        } catch (err) {
            showToast('❌ خطأ: ' + err.message, 'error');
        }
    });

    // ---- نموذج المباراة ----
    document.getElementById('matchForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
        const form = e.target;
        const id = form.dataset.id || document.getElementById('matchFormId').value;
        const team1 = document.getElementById('mTeam1').value;
        const team2 = document.getElementById('mTeam2').value;
        if (team1 === team2) return showToast('لا يمكن أن يكون الفريقان متطابقين', 'error');
        const data = {
            team1,
            team2,
            score1: parseInt(document.getElementById('mScore1').value) || 0,
            score2: parseInt(document.getElementById('mScore2').value) || 0,
            date: document.getElementById('mDate').value,
            tournament: document.getElementById('mTournament').value,
        };
        try {
            if (id && form.dataset.mode === 'update') {
                await dataManager.update('matches', id, data);
                showToast('✅ تم التحديث بنجاح', 'success');
            } else {
                await dataManager.add('matches', data);
                showToast('✅ تم الإضافة بنجاح', 'success');
            }
            document.getElementById('matchModal').classList.remove('open');
            form.dataset.mode = '';
            form.dataset.id = '';
            form.reset();
        } catch (err) {
            showToast('❌ خطأ: ' + err.message, 'error');
        }
    });

    // ---- نموذج البطولة ----
    document.getElementById('tournamentForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
        const form = e.target;
        const id = form.dataset.id || document.getElementById('tournamentFormId').value;
        const clubsSelect = document.getElementById('tClubs');
        const selectedClubs = Array.from(clubsSelect.selectedOptions).map(o => o.value);
        const data = {
            name: document.getElementById('tName').value.trim(),
            year: parseInt(document.getElementById('tYear').value) || null,
            winner: document.getElementById('tWinner').value || '',
            clubs: selectedClubs,
        };
        if (!data.name) return showToast('يرجى إدخال اسم البطولة', 'error');
        try {
            if (id && form.dataset.mode === 'update') {
                await dataManager.update('tournaments', id, data);
                showToast('✅ تم التحديث بنجاح', 'success');
            } else {
                await dataManager.add('tournaments', data);
                showToast('✅ تم الإضافة بنجاح', 'success');
            }
            document.getElementById('tournamentModal').classList.remove('open');
            form.dataset.mode = '';
            form.dataset.id = '';
            form.reset();
        } catch (err) {
            showToast('❌ خطأ: ' + err.message, 'error');
        }
    });

    // ---- نموذج السؤال ----
    document.getElementById('questionForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!authService.checkPermission('editor')) return showToast('ليس لديك صلاحية', 'error');
        const form = e.target;
        const id = form.dataset.id || document.getElementById('qFormId').value;
        const options = [
            document.getElementById('qOpt1').value.trim(),
            document.getElementById('qOpt2').value.trim(),
            document.getElementById('qOpt3').value.trim(),
            document.getElementById('qOpt4').value.trim(),
        ];
        if (options.some(o => !o)) return showToast('يرجى إدخال جميع الخيارات', 'error');
        const data = {
            question: document.getElementById('qText').value.trim(),
            options,
            correct: parseInt(document.getElementById('qCorrect').value),
            difficulty: document.getElementById('qDifficulty').value,
            category: document.getElementById('qCategory').value,
        };
        if (!data.question) return showToast('يرجى إدخال نص السؤال', 'error');
        try {
            if (id && form.dataset.mode === 'update') {
                await dataManager.update('questions', id, data);
                showToast('✅ تم التحديث بنجاح', 'success');
            } else {
                await dataManager.add('questions', data);
                showToast('✅ تم الإضافة بنجاح', 'success');
            }
            document.getElementById('questionModal').classList.remove('open');
            form.dataset.mode = '';
            form.dataset.id = '';
            form.reset();
        } catch (err) {
            showToast('❌ خطأ: ' + err.message, 'error');
        }
    });

    // ---- زر مسح الفلاتر ----
    document.querySelectorAll('.clear-filters-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            document.getElementById(`search${capitalize(section)}`).value = '';
            if (section === 'players') {
                document.getElementById('filterPlayerPosition').value = '';
            }
            if (section === 'questions') {
                document.getElementById('filterQuestionCategory').value = '';
            }
            // إعادة تعيين الصفحة إلى 1
            localStorage.setItem(`${section}Page`, '1');
            // إعادة عرض الجدول
            document.dispatchEvent(new CustomEvent('renderTables', { detail: dataManager.data }));
        });
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// معالجات البحث والفلاتر
// ============================================================

function setupSearchHandlers() {
    const searchFields = ['player', 'club', 'match', 'tournament', 'question'];
    searchFields.forEach(field => {
        const input = document.getElementById(`search${capitalize(field)}`);
        if (input) {
            input.addEventListener('input', () => {
                localStorage.setItem(`${field}Page`, '1');
                document.dispatchEvent(new CustomEvent('renderTables', { detail: dataManager.data }));
            });
        }
    });

    // فلاتر إضافية
    document.getElementById('filterPlayerPosition')?.addEventListener('change', () => {
        localStorage.setItem('playerPage', '1');
        document.dispatchEvent(new CustomEvent('renderTables', { detail: dataManager.data }));
    });

    document.getElementById('filterQuestionCategory')?.addEventListener('change', () => {
        localStorage.setItem('questionPage', '1');
        document.dispatchEvent(new CustomEvent('renderTables', { detail: dataManager.data }));
    });
}

// ============================================================
// معالجات الإعدادات
// ============================================================

function setupSettingsHandlers() {
    // تصدير
    document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
        try {
            const data = await dataManager.exportData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `football_data_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ تم التصدير بنجاح', 'success');
        } catch (e) {
            showToast('❌ خطأ في التصدير: ' + e.message, 'error');
        }
    });

    // استيراد
    document.getElementById('importDataBtn')?.addEventListener('click', () => {
        document.getElementById('importFileInput')?.click();
    });

    document.getElementById('importFileInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (confirm('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
                await dataManager.importData(data);
                showToast('✅ تم استيراد البيانات بنجاح', 'success');
            }
        } catch (err) {
            showToast('❌ خطأ في الاستيراد: ' + err.message, 'error');
        }
        e.target.value = '';
    });

    // إعادة تعيين
    document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
        if (!authService.checkPermission('admin')) return showToast('أنت لست مديراً!', 'error');
        if (confirm('سيتم مسح جميع البيانات من Firebase. هل أنت متأكد؟')) {
            try {
                await dataManager.resetAll();
                showToast('✅ تم إعادة تعيين البيانات', 'success');
            } catch (e) {
                showToast('❌ خطأ: ' + e.message, 'error');
            }
        }
    });

    // تغيير كلمة المرور
    document.getElementById('changePasswordBtn')?.addEventListener('click', async () => {
        if (!authService.currentUser) return showToast('يجب تسجيل الدخول أولاً', 'error');
        const newPass = prompt('أدخل كلمة المرور الجديدة (4 أحرف على الأقل):');
        if (newPass && newPass.length >= 4) {
            try {
                await authService.changePassword(newPass);
                showToast('✅ تم تغيير كلمة المرور بنجاح', 'success');
            } catch (e) {
                showToast('❌ خطأ: ' + e.message, 'error');
            }
        } else if (newPass !== null) {
            showToast('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error');
        }
    });

    // تسجيل الخروج
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        authService.logout();
        document.getElementById('loginModal').classList.add('open');
    });
    document.getElementById('logoutBtn2')?.addEventListener('click', () => {
        authService.logout();
        document.getElementById('loginModal').classList.add('open');
    });
}

// ============================================================
// معالجات المصادقة (تسجيل الدخول والتسجيل)
// ============================================================

function setupAuthHandlers() {
    // إغلاق مودال تسجيل الدخول
    document.getElementById('closeLoginModal')?.addEventListener('click', () => {
        document.getElementById('loginModal').classList.remove('open');
    });

    // التبويبات
    document.querySelectorAll('.tab-login').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab-login').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.dataset.tab;
            document.getElementById('loginForm').style.display = tabName === 'login' ? 'block' : 'none';
            document.getElementById('registerForm').style.display = tabName === 'register' ? 'block' : 'none';
            document.getElementById('loginError').style.display = 'none';
            document.getElementById('registerError').style.display = 'none';
        });
    });

    // نموذج تسجيل الدخول
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const errorEl = document.getElementById('loginError');
        const loadingEl = document.getElementById('loginLoading');
        const submitBtn = document.getElementById('loginSubmitBtn');
        errorEl.style.display = 'none';
        loadingEl.style.display = 'block';
        submitBtn.disabled = true;
        try {
            await authService.login(email, password);
            document.getElementById('loginModal').classList.remove('open');
            await dataManager.loadAll();
            showToast('✅ تم تسجيل الدخول بنجاح', 'success');
        } catch (e) {
            errorEl.textContent = '❌ ' + e.message;
            errorEl.style.display = 'block';
        }
        loadingEl.style.display = 'none';
        submitBtn.disabled = false;
    });

    // نموذج التسجيل
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        const errorEl = document.getElementById('registerError');
        const loadingEl = document.getElementById('registerLoading');
        const submitBtn = document.getElementById('registerSubmitBtn');
        errorEl.style.display = 'none';
        loadingEl.style.display = 'block';
        submitBtn.disabled = true;
        try {
            await authService.register(email, password, username, username);
            document.getElementById('loginModal').classList.remove('open');
            await dataManager.loadAll();
            showToast('✅ تم إنشاء الحساب بنجاح', 'success');
        } catch (e) {
            errorEl.textContent = '❌ ' + e.message;
            errorEl.style.display = 'block';
        }
        loadingEl.style.display = 'none';
        submitBtn.disabled = false;
    });
}

// ============================================================
// تبديل الثيم (الوضع الليلي/النهاري)
// ============================================================

function setupThemeToggle() {
    // إضافة زر التبديل في الإعدادات
    const settingsCard = document.querySelector('#section-settings .card');
    if (settingsCard) {
        const themeSection = document.createElement('div');
        themeSection.innerHTML = `
            <hr style="border-color:var(--glass-border);margin:1.5rem 0;">
            <h3 class="card-title"><i class="fas fa-palette"></i> المظهر</h3>
            <button class="btn btn-outline" id="themeToggleBtn">
                <i class="fas fa-moon"></i> الوضع الليلي
            </button>
        `;
        settingsCard.appendChild(themeSection);
    }

    // زر تبديل الثيم
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');
        if (isDark) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-sun"></i> الوضع النهاري';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-moon"></i> الوضع الليلي';
            localStorage.setItem('theme', 'dark');
        }
    });

    // استعادة الثيم المخزن
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-sun"></i> الوضع النهاري';
    } else {
        document.body.classList.add('dark-theme');
    }
}