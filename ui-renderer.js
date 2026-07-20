// ============================================================
// ui-renderer.js – عرض الواجهات الديناميكية
// ============================================================

class UIRenderer {
    constructor() {
        this.container = document.getElementById('sectionsContainer');
        this.modalsContainer = document.getElementById('modalsContainer');
        this.navLinks = [];
    }

    buildLayout() {
        this._buildSidebar();
        this._buildSections();
        this._buildModals();
    }

    _buildSidebar() {
        const nav = document.getElementById('mainNav');
        const items = [
            { section: 'dashboard', icon: 'fa-house', label: 'الرئيسية' },
            { section: 'players', icon: 'fa-users', label: 'اللاعبين' },
            { section: 'clubs', icon: 'fa-trophy', label: 'الأندية' },
            { section: 'matches', icon: 'fa-futbol', label: 'المباريات' },
            { section: 'tournaments', icon: 'fa-medal', label: 'البطولات' },
            { section: 'questions', icon: 'fa-question-circle', label: 'الأسئلة' },
            { section: 'game', icon: 'fa-gamepad', label: 'اللعبة' },
            { section: 'settings', icon: 'fa-cog', label: 'الإعدادات' }
        ];
        nav.innerHTML = items.map(item => `
            <a href="#" data-section="${item.section}" class="${item.section === 'dashboard' ? 'active' : ''}">
                <i class="fas ${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `).join('');
        this.navLinks = nav.querySelectorAll('a');
    }

    _buildSections() {
        const sections = [
            { id: 'dashboard', template: this._renderDashboard.bind(this) },
            { id: 'players', template: this._renderPlayersSection.bind(this) },
            { id: 'clubs', template: this._renderClubsSection.bind(this) },
            { id: 'matches', template: this._renderMatchesSection.bind(this) },
            { id: 'tournaments', template: this._renderTournamentsSection.bind(this) },
            { id: 'questions', template: this._renderQuestionsSection.bind(this) },
            { id: 'game', template: this._renderGameSection.bind(this) },
            { id: 'settings', template: this._renderSettingsSection.bind(this) }
        ];
        this.container.innerHTML = sections.map(s => `
            <section id="section-${s.id}" class="section ${s.id === 'dashboard' ? 'active' : ''}">
                ${s.template()}
            </section>
        `).join('');
    }

    _buildModals() {
        this.modalsContainer.innerHTML = `
            <!-- مودال تسجيل الدخول -->
            <div class="modal-overlay login-modal" id="loginModal">
                <div class="modal-card">
                    <div class="flex-between mb-1">
                        <h3 class="card-title"><i class="fas fa-user-circle"></i> الحساب</h3>
                        <button class="btn btn-sm" id="closeLoginModal" style="background:transparent;color:var(--gray);">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div style="display:flex; gap:12px; margin-bottom:1.5rem; border-bottom:1px solid var(--glass-border); padding-bottom:4px;">
                        <button class="btn btn-sm tab-login active" data-tab="login" style="background:transparent; color:var(--light); border-bottom:2px solid var(--primary); border-radius:0; padding:6px 0;">تسجيل الدخول</button>
                        <button class="btn btn-sm tab-login" data-tab="register" style="background:transparent; color:var(--gray); border-radius:0; padding:6px 0;">إنشاء حساب</button>
                    </div>
                    <form id="loginForm" class="login-form">
                        <div class="form-group"><label>البريد الإلكتروني</label><input type="email" id="loginEmail" placeholder="example@mail.com"></div>
                        <div class="form-group"><label>كلمة المرور</label><input type="password" id="loginPassword" placeholder="••••••••"></div>
                        <div class="login-error" id="loginError">بيانات الدخول غير صحيحة</div>
                        <div class="login-loading" id="loginLoading"><i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...</div>
                        <button type="submit" class="btn btn-primary w-100" style="justify-content:center;" id="loginSubmitBtn">
                            <i class="fas fa-sign-in-alt"></i> دخول
                        </button>
                    </form>
                    <form id="registerForm" class="login-form" style="display:none;">
                        <div class="form-group"><label>اسم المستخدم (للظهور)</label><input type="text" id="regUsername" placeholder="أحمد" required></div>
                        <div class="form-group"><label>البريد الإلكتروني</label><input type="email" id="regEmail" placeholder="example@mail.com" required></div>
                        <div class="form-group"><label>كلمة المرور (6 أحرف على الأقل)</label><input type="password" id="regPassword" placeholder="••••••••" required minlength="6"></div>
                        <div class="login-error" id="registerError" style="color:var(--secondary); display:none;"></div>
                        <div class="login-loading" id="registerLoading" style="display:none;"><i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...</div>
                        <button type="submit" class="btn btn-success w-100" style="justify-content:center;" id="registerSubmitBtn">
                            <i class="fas fa-user-plus"></i> إنشاء حساب
                        </button>
                    </form>
                    <div class="text-gray mt-1" style="font-size:0.8rem;">🔹 قم بإنشاء حساب جديد للبدء، أو استخدم حساباً موجوداً.</div>
                </div>
            </div>

            <!-- مودال اللاعب -->
            <div class="modal-overlay" id="playerModal"><div class="modal-card">
                <div class="flex-between mb-1"><h3 class="card-title" id="playerModalTitle"><i class="fas fa-user"></i> إضافة لاعب</h3><button class="btn btn-sm" id="closePlayerModal" style="background:transparent;color:var(--gray);"><i class="fas fa-times"></i></button></div>
                <form id="playerForm">
                    <input type="hidden" id="playerFormId">
                    <div class="form-row"><div class="form-group"><label>الاسم *</label><input type="text" id="pName" required></div><div class="form-group"><label>النادي *</label><select id="pClub" required></select></div></div>
                    <div class="form-row"><div class="form-group"><label>المركز *</label><select id="pPosition" required><option value="">اختر</option><option value="حارس مرمى">حارس مرمى</option><option value="مدافع">مدافع</option><option value="وسط">وسط</option><option value="مهاجم">مهاجم</option></select></div><div class="form-group"><label>العمر *</label><input type="number" id="pAge" required min="16" max="45"></div></div>
                    <div class="form-row"><div class="form-group"><label>الجنسية</label><input type="text" id="pNationality"></div><div class="form-group"><label>رقم القميص</label><input type="number" id="pNumber" min="1" max="99"></div></div>
                    <div class="form-row"><div class="form-group"><label>الأهداف</label><input type="number" id="pGoals" min="0" value="0"></div><div class="form-group"><label>التمريرات</label><input type="number" id="pAssists" min="0" value="0"></div></div>
                    <div class="form-group"><label>رابط الصورة</label><input type="url" id="pImage" placeholder="https://example.com/player.jpg"></div>
                    <button type="submit" class="btn btn-primary w-100" style="justify-content:center;"><i class="fas fa-save"></i> حفظ</button>
                </form>
            </div></div>

            <!-- مودال النادي -->
            <div class="modal-overlay" id="clubModal"><div class="modal-card">
                <div class="flex-between mb-1"><h3 class="card-title" id="clubModalTitle"><i class="fas fa-trophy"></i> إضافة نادي</h3><button class="btn btn-sm" id="closeClubModal" style="background:transparent;color:var(--gray);"><i class="fas fa-times"></i></button></div>
                <form id="clubForm">
                    <input type="hidden" id="clubFormId">
                    <div class="form-group"><label>اسم النادي *</label><input type="text" id="cName" required></div>
                    <div class="form-group"><label>المدينة</label><input type="text" id="cCity"></div>
                    <div class="form-group"><label>الدوري</label><input type="text" id="cLeague"></div>
                    <div class="form-group"><label>سنة التأسيس</label><input type="number" id="cFounded" min="1800" max="2030"></div>
                    <div class="form-group"><label>رابط الشعار</label><input type="url" id="cLogo" placeholder="https://example.com/logo.png"></div>
                    <button type="submit" class="btn btn-primary w-100" style="justify-content:center;"><i class="fas fa-save"></i> حفظ</button>
                </form>
            </div></div>

            <!-- مودال المباراة -->
            <div class="modal-overlay" id="matchModal"><div class="modal-card">
                <div class="flex-between mb-1"><h3 class="card-title" id="matchModalTitle"><i class="fas fa-futbol"></i> إضافة مباراة</h3><button class="btn btn-sm" id="closeMatchModal" style="background:transparent;color:var(--gray);"><i class="fas fa-times"></i></button></div>
                <form id="matchForm">
                    <input type="hidden" id="matchFormId">
                    <div class="form-row"><div class="form-group"><label>الفريق الأول *</label><select id="mTeam1" required></select></div><div class="form-group"><label>الفريق الثاني *</label><select id="mTeam2" required></select></div></div>
                    <div class="form-row"><div class="form-group"><label>نتيجة الفريق الأول</label><input type="number" id="mScore1" min="0" value="0"></div><div class="form-group"><label>نتيجة الفريق الثاني</label><input type="number" id="mScore2" min="0" value="0"></div></div>
                    <div class="form-row"><div class="form-group"><label>التاريخ</label><input type="date" id="mDate"></div><div class="form-group"><label>البطولة</label><select id="mTournament"></select></div></div>
                    <button type="submit" class="btn btn-primary w-100" style="justify-content:center;"><i class="fas fa-save"></i> حفظ</button>
                </form>
            </div></div>

            <!-- مودال البطولة -->
            <div class="modal-overlay" id="tournamentModal"><div class="modal-card">
                <div class="flex-between mb-1"><h3 class="card-title" id="tournamentModalTitle"><i class="fas fa-medal"></i> إضافة بطولة</h3><button class="btn btn-sm" id="closeTournamentModal" style="background:transparent;color:var(--gray);"><i class="fas fa-times"></i></button></div>
                <form id="tournamentForm">
                    <input type="hidden" id="tournamentFormId">
                    <div class="form-group"><label>اسم البطولة *</label><input type="text" id="tName" required></div>
                    <div class="form-group"><label>السنة</label><input type="number" id="tYear" min="1900" max="2100"></div>
                    <div class="form-group"><label>الفائز</label><select id="tWinner"><option value="">—</option></select></div>
                    <div class="form-group"><label>الأندية المشاركة (اختيار متعدد)</label><select id="tClubs" multiple style="height:100px;"></select></div>
                    <button type="submit" class="btn btn-primary w-100" style="justify-content:center;"><i class="fas fa-save"></i> حفظ</button>
                </form>
            </div></div>

            <!-- مودال السؤال -->
            <div class="modal-overlay" id="questionModal"><div class="modal-card">
                <div class="flex-between mb-1"><h3 class="card-title" id="questionModalTitle"><i class="fas fa-question"></i> إضافة سؤال</h3><button class="btn btn-sm" id="closeQuestionModal" style="background:transparent;color:var(--gray);"><i class="fas fa-times"></i></button></div>
                <form id="questionForm">
                    <input type="hidden" id="qFormId">
                    <div class="form-group"><label>السؤال *</label><textarea id="qText" required></textarea></div>
                    <div class="form-row"><div class="form-group"><label>الخيار 1 *</label><input type="text" id="qOpt1" required></div><div class="form-group"><label>الخيار 2 *</label><input type="text" id="qOpt2" required></div></div>
                    <div class="form-row"><div class="form-group"><label>الخيار 3 *</label><input type="text" id="qOpt3" required></div><div class="form-group"><label>الخيار 4 *</label><input type="text" id="qOpt4" required></div></div>
                    <div class="form-row"><div class="form-group"><label>الإجابة الصحيحة</label><select id="qCorrect"><option value="0">خيار 1</option><option value="1">خيار 2</option><option value="2">خيار 3</option><option value="3">خيار 4</option></select></div><div class="form-group"><label>الصعوبة</label><select id="qDifficulty"><option value="سهل">سهل</option><option value="متوسط" selected>متوسط</option><option value="صعب">صعب</option></select></div></div>
                    <div class="form-group"><label>الفئة</label><select id="qCategory"><option value="عام">عام</option><option value="تاريخ">تاريخ</option><option value="لاعبين">لاعبين</option><option value="أندية">أندية</option><option value="بطولات">بطولات</option></select></div>
                    <button type="submit" class="btn btn-primary w-100" style="justify-content:center;"><i class="fas fa-save"></i> حفظ</button>
                </form>
            </div></div>
        `;
    }

    _renderDashboard() {
        return `
            <div class="flex-between mb-2">
                <h1 style="font-size:2rem;font-weight:900;"><i class="fas fa-chart-line" style="color:var(--accent);"></i> لوحة التحكم</h1>
                <div class="flex-center">
                    <span class="text-gray" id="welcomeUser">مرحباً بك!</span>
                    <button class="btn btn-sm btn-primary" id="syncDataBtn"><i class="fas fa-sync"></i> مزامنة</button>
                </div>
            </div>
            <div class="grid-4 mb-2" id="statsGrid">
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-number" id="statPlayers">0</div><div class="stat-label">اللاعبين</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-trophy"></i></div><div class="stat-number" id="statClubs">0</div><div class="stat-label">الأندية</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-futbol"></i></div><div class="stat-number" id="statMatches">0</div><div class="stat-label">المباريات</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-medal"></i></div><div class="stat-number" id="statTournaments">0</div><div class="stat-label">البطولات</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-question-circle"></i></div><div class="stat-number" id="statQuestions">0</div><div class="stat-label">الأسئلة</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-gamepad"></i></div><div class="stat-number" id="statGamesPlayed">0</div><div class="stat-label">مرات اللعب</div></div>
            </div>
            <div class="grid-2 mb-2">
                <div class="card"><div class="card-title"><i class="fas fa-chart-pie"></i> توزيع اللاعبين حسب المركز</div><div class="chart-container"><canvas id="positionChart"></canvas></div></div>
                <div class="card"><div class="card-title"><i class="fas fa-chart-bar"></i> توزيع الأسئلة حسب الفئة</div><div class="chart-container"><canvas id="categoryChart"></canvas></div></div>
            </div>
            <div class="grid-2">
                <div class="card"><div class="card-title"><i class="fas fa-user-plus"></i> آخر اللاعبين</div><div id="recentPlayers">جاري التحميل...</div></div>
                <div class="card"><div class="card-title"><i class="fas fa-plus-circle"></i> آخر المباريات</div><div id="recentMatches">جاري التحميل...</div></div>
            </div>
        `;
    }

    _renderPlayersSection() {
        return `
            <div class="flex-between mb-2">
                <h2 style="font-size:1.8rem;font-weight:800;"><i class="fas fa-users" style="color:var(--accent);"></i> إدارة اللاعبين</h2>
                <button class="btn btn-primary" id="openAddPlayer"><i class="fas fa-plus"></i> إضافة لاعب</button>
            </div>
            <div class="card">
                <div class="flex-between mb-1">
                    <div class="flex-center gap-1">
                        <i class="fas fa-search text-gray"></i>
                        <input type="text" id="searchPlayer" placeholder="بحث..." style="background:transparent;border-bottom:2px solid var(--glass-border);padding:8px 4px;color:var(--light);width:200px;">
                        <select id="filterPlayerPosition" style="background:transparent;border-bottom:2px solid var(--glass-border);padding:8px 4px;color:var(--light);">
                            <option value="">كل المراكز</option>
                            <option value="حارس مرمى">حارس مرمى</option>
                            <option value="مدافع">مدافع</option>
                            <option value="وسط">وسط</option>
                            <option value="مهاجم">مهاجم</option>
                        </select>
                    </div>
                    <span class="text-gray" id="playerCount">0</span>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>#</th><th>الاسم</th><th>النادي</th><th>المركز</th><th>العمر</th><th>الجنسية</th><th>الأهداف</th><th>الصورة</th><th>الإجراءات</th></tr></thead>
                        <tbody id="playersTableBody"><tr><td colspan="9" class="text-center text-gray">جاري التحميل...</td></tr></tbody>
                    </table>
                </div>
                <div class="pagination" id="playerPagination"></div>
            </div>
        `;
    }

    _renderClubsSection() {
        return `
            <div class="flex-between mb-2">
                <h2 style="font-size:1.8rem;font-weight:800;"><i class="fas fa-trophy" style="color:var(--accent);"></i> إدارة الأندية</h2>
                <button class="btn btn-primary" id="openAddClub"><i class="fas fa-plus"></i> إضافة نادي</button>
            </div>
            <div class="card">
                <div class="flex-between mb-1">
                    <div class="flex-center gap-1"><i class="fas fa-search text-gray"></i><input type="text" id="searchClub" placeholder="بحث..." style="background:transparent;border-bottom:2px solid var(--glass-border);padding:8px 4px;color:var(--light);width:200px;"></div>
                    <span class="text-gray" id="clubCount">0</span>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>#</th><th>الاسم</th><th>المدينة</th><th>الدوري</th><th>التأسيس</th><th>الشعار</th><th>الإجراءات</th></tr></thead>
                        <tbody id="clubsTableBody"><tr><td colspan="7" class="text-center text-gray">جاري التحميل...</td></tr></tbody>
                    </table>
                </div>
                <div class="pagination" id="clubPagination"></div>
            </div>
        `;
    }

    _renderMatchesSection() {
        return `
            <div class="flex-between mb-2">
                <h2 style="font-size:1.8rem;font-weight:800;"><i class="fas fa-futbol" style="color:var(--accent);"></i> إدارة المباريات</h2>
                <button class="btn btn-primary" id="openAddMatch"><i class="fas fa-plus"></i> إضافة مباراة</button>
            </div>
            <div class="card">
                <div class="flex-between mb-1">
                    <div class="flex-center gap-1"><i class="fas fa-search text-gray"></i><input type="text" id="searchMatch" placeholder="بحث..." style="background:transparent;border-bottom:2px solid var(--glass-border);padding:8px 4px;color:var(--light);width:200px;"></div>
                    <span class="text-gray" id="matchCount">0</span>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>#</th><th>الفريق الأول</th><th>الفريق الثاني</th><th>النتيجة</th><th>التاريخ</th><th>البطولة</th><th>الإجراءات</th></tr></thead>
                        <tbody id="matchesTableBody"><tr><td colspan="7" class="text-center text-gray">جاري التحميل...</td></tr></tbody>
                    </table>
                </div>
                <div class="pagination" id="matchPagination"></div>
            </div>
        `;
    }

    _renderTournamentsSection() {
        return `
            <div class="flex-between mb-2">
                <h2 style="font-size:1.8rem;font-weight:800;"><i class="fas fa-medal" style="color:var(--accent);"></i> إدارة البطولات</h2>
                <button class="btn btn-primary" id="openAddTournament"><i class="fas fa-plus"></i> إضافة بطولة</button>
            </div>
            <div class="card">
                <div class="flex-between mb-1">
                    <div class="flex-center gap-1"><i class="fas fa-search text-gray"></i><input type="text" id="searchTournament" placeholder="بحث..." style="background:transparent;border-bottom:2px solid var(--glass-border);padding:8px 4px;color:var(--light);width:200px;"></div>
                    <span class="text-gray" id="tournamentCount">0</span>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>#</th><th>الاسم</th><th>السنة</th><th>الفائز</th><th>الأندية المشاركة</th><th>الإجراءات</th></tr></thead>
                        <tbody id="tournamentsTableBody"><tr><td colspan="6" class="text-center text-gray">جاري التحميل...</td></tr></tbody>
                    </table>
                </div>
                <div class="pagination" id="tournamentPagination"></div>
            </div>
        `;
    }

    _renderQuestionsSection() {
        return `
            <div class="flex-between mb-2">
                <h2 style="font-size:1.8rem;font-weight:800;"><i class="fas fa-question-circle" style="color:var(--accent);"></i> بنك الأسئلة</h2>
                <button class="btn btn-primary" id="openAddQuestion"><i class="fas fa-plus"></i> إضافة سؤال</button>
            </div>
            <div class="card">
                <div class="flex-between mb-1">
                    <div class="flex-center gap-1">
                        <i class="fas fa-search text-gray"></i>
                        <input type="text" id="searchQuestion" placeholder="بحث..." style="background:transparent;border-bottom:2px solid var(--glass-border);padding:8px 4px;color:var(--light);width:200px;">
                        <select id="filterQuestionCategory" style="background:transparent;border-bottom:2px solid var(--glass-border);padding:8px 4px;color:var(--light);">
                            <option value="">كل الفئات</option>
                            <option value="عام">عام</option>
                            <option value="تاريخ">تاريخ</option>
                            <option value="لاعبين">لاعبين</option>
                            <option value="أندية">أندية</option>
                            <option value="بطولات">بطولات</option>
                        </select>
                    </div>
                    <span class="text-gray" id="questionCount">0</span>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>#</th><th>السؤال</th><th>الفئة</th><th>الصعوبة</th><th>الإجراءات</th></tr></thead>
                        <tbody id="questionsTableBody"><tr><td colspan="5" class="text-center text-gray">جاري التحميل...</td></tr></tbody>
                    </table>
                </div>
                <div class="pagination" id="questionPagination"></div>
            </div>
        `;
    }

    _renderGameSection() {
        return `
            <div class="game-container">
                <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:1.5rem;text-align:center;">
                    <i class="fas fa-gamepad" style="color:var(--accent);"></i> لعبة الأسئلة
                </h2>
                <div id="gameStartScreen">
                    <div class="card text-center" style="max-width:500px;margin:0 auto;">
                        <div style="font-size:4rem;margin-bottom:1rem;">⚽</div>
                        <h3 style="font-size:1.6rem;font-weight:800;margin-bottom:0.5rem;">تحدى معرفتك</h3>
                        <p class="text-gray" style="margin-bottom:1.5rem;">اختر المستوى وابدأ التحدي</p>
                        <div class="form-group"><label>المستوى</label>
                            <select id="gameDifficulty">
                                <option value="easy">سهل (20 ثانية، نقطة واحدة)</option>
                                <option value="medium" selected>متوسط (15 ثانية، نقطتان)</option>
                                <option value="hard">صعب (10 ثوانٍ، 3 نقاط)</option>
                            </select>
                        </div>
                        <div class="form-group"><label>الفئة</label>
                            <select id="gameCategory">
                                <option value="all">كل الفئات</option>
                                <option value="عام">عام</option>
                                <option value="تاريخ">تاريخ</option>
                                <option value="لاعبين">لاعبين</option>
                                <option value="أندية">أندية</option>
                                <option value="بطولات">بطولات</option>
                            </select>
                        </div>
                        <div class="form-group"><label>عدد الأسئلة</label>
                            <select id="gameCount">
                                <option value="5">5</option>
                                <option value="10" selected>10</option>
                                <option value="15">15</option>
                                <option value="20">20</option>
                            </select>
                        </div>
                        <button class="btn btn-primary w-100" id="startGameBtn" style="justify-content:center;font-size:1.1rem;padding:14px;">
                            <i class="fas fa-play"></i> ابدأ
                        </button>
                    </div>
                </div>
                <div id="gamePlayScreen" style="display:none;">
                    <div class="game-progress">
                        <span class="text-gray" id="gameQCounter">1 / 10</span>
                        <div class="progress-bar"><div class="fill" id="gameProgressFill" style="width:0%;"></div></div>
                        <span class="text-gray" id="gameScoreDisplay">⭐ 0</span>
                    </div>
                    <div class="question-box">
                        <div class="q-category" id="gameQCategory">عام</div>
                        <div class="q-text" id="gameQText">Loading...</div>
                        <div class="options-grid" id="gameOptions"></div>
                    </div>
                    <div class="flex-center" style="justify-content:space-between;">
                        <button class="btn btn-sm" id="gameQuitBtn" style="background:transparent;color:var(--gray);"><i class="fas fa-times"></i> إنهاء</button>
                        <span class="text-gray" id="gameTimerDisplay">⏱ 0s</span>
                    </div>
                </div>
                <div id="gameResultScreen" style="display:none;">
                    <div class="card game-result">
                        <div style="font-size:4rem;margin-bottom:0.5rem;">🏆</div>
                        <div class="result-score" id="resultFinalScore">0</div>
                        <div class="result-detail" id="resultDetail">أحسنت!</div>
                        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
                            <button class="btn btn-primary" id="gameReplayBtn"><i class="fas fa-redo"></i> لعب مجدداً</button>
                            <button class="btn btn-sm" id="gameHomeBtn" style="background:var(--glass);color:var(--light);"><i class="fas fa-home"></i> الرئيسية</button>
                        </div>
                        <div class="leaderboard mt-2">
                            <h4 style="color:var(--accent);"><i class="fas fa-crown"></i> المتصدرون</h4>
                            <div id="leaderboardList"><div class="text-gray">لا توجد نتائج بعد</div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderSettingsSection() {
        return `
            <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:1.5rem;"><i class="fas fa-cog" style="color:var(--accent);"></i> الإعدادات</h2>
            <div class="card">
                <h3 class="card-title"><i class="fas fa-cloud"></i> اتصال Firebase</h3>
                <p class="text-gray">الحالة: <span id="firebaseStatus">جاري التحقق...</span></p>
                <hr style="border-color:var(--glass-border);margin:1.5rem 0;">
                <h3 class="card-title"><i class="fas fa-database"></i> إدارة البيانات</h3>
                <div class="flex-center gap-1" style="flex-wrap:wrap;">
                    <button class="btn btn-primary" id="exportDataBtn"><i class="fas fa-download"></i> تصدير (JSON)</button>
                    <button class="btn btn-outline" id="importDataBtn"><i class="fas fa-upload"></i> استيراد</button>
                    <button class="btn btn-danger" id="resetDataBtn"><i class="fas fa-trash"></i> إعادة تعيين</button>
                    <input type="file" id="importFileInput" accept=".json" style="display:none;">
                </div>
                <hr style="border-color:var(--glass-border);margin:1.5rem 0;">
                <h3 class="card-title"><i class="fas fa-users-cog"></i> إدارة المستخدمين</h3>
                <p class="text-gray">المستخدم الحالي: <strong id="settingsCurrentUser">زائر</strong> (الصلاحية: <span id="settingsCurrentRole">viewer</span>)</p>
                <button class="btn btn-primary" id="changePasswordBtn"><i class="fas fa-key"></i> تغيير كلمة المرور</button>
                <button class="btn btn-outline" id="logoutBtn2"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>
                <hr style="border-color:var(--glass-border);margin:1.5rem 0;">
                <h3 class="card-title"><i class="fas fa-code"></i> إعدادات Firebase</h3>
                <p class="text-gray" style="font-size:0.85rem;">قم بتعديل كائن <code>firebaseConfig</code> في ملف <code>js/firebase-config.js</code> لتوصيل مشروعك.</p>
            </div>
        `;
    }

    updateStats(stats) {
        document.getElementById('statPlayers').textContent = stats.players || 0;
        document.getElementById('statClubs').textContent = stats.clubs || 0;
        document.getElementById('statMatches').textContent = stats.matches || 0;
        document.getElementById('statTournaments').textContent = stats.tournaments || 0;
        document.getElementById('statQuestions').textContent = stats.questions || 0;
        const games = parseInt(localStorage.getItem('footballGamesPlayed') || '0');
        document.getElementById('statGamesPlayed').textContent = games;
    }

    updateUserUI(user) {
        const nameEl = document.getElementById('userNameDisplay');
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutBtn2 = document.getElementById('logoutBtn2');
        const settingsUser = document.getElementById('settingsCurrentUser');
        const settingsRole = document.getElementById('settingsCurrentRole');
        const welcomeUser = document.getElementById('welcomeUser');

        if (user) {
            const displayName = user.username || user.displayName || user.email;
            nameEl.textContent = displayName;
            logoutBtn.style.display = 'inline-flex';
            logoutBtn2.style.display = 'inline-flex';
            settingsUser.textContent = displayName;
            settingsRole.textContent = user.role;
            welcomeUser.textContent = `مرحباً ${displayName} (${user.role})`;
            const isEditor = user.role === 'admin' || user.role === 'editor';
            document.querySelectorAll('.btn-primary, .btn-danger, .btn-success, .btn-warning').forEach(el => {
                if (el.closest('.modal-overlay')) return;
                if (!isEditor) el.style.display = 'none';
                else el.style.display = 'inline-flex';
            });
            document.querySelectorAll('.modal-card .btn-primary').forEach(el => {
                if (!isEditor) el.style.display = 'none';
                else el.style.display = 'inline-flex';
            });
            document.querySelectorAll('[id^="openAdd"]').forEach(el => {
                if (!isEditor) el.style.display = 'none';
                else el.style.display = 'inline-flex';
            });
        } else {
            nameEl.textContent = 'زائر';
            logoutBtn.style.display = 'none';
            logoutBtn2.style.display = 'none';
            settingsUser.textContent = 'زائر';
            settingsRole.textContent = 'viewer';
            welcomeUser.textContent = 'مرحباً بك! (زائر)';
            document.querySelectorAll('.btn-primary, .btn-danger, .btn-success, .btn-warning').forEach(el => {
                if (el.closest('.modal-overlay')) return;
                el.style.display = 'none';
            });
            document.querySelectorAll('[id^="openAdd"]').forEach(el => el.style.display = 'none');
        }
    }

    getNavLinks() {
        return this.navLinks;
    }

    activateSection(id) {
        this.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === id);
        });
        document.querySelectorAll('.section').forEach(el => {
            el.classList.toggle('active', el.id === `section-${id}`);
        });
    }
}

const uiRenderer = new UIRenderer();
export default uiRenderer;