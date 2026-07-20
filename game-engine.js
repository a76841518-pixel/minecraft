// ============================================================
// game-engine.js – محرك لعبة الأسئلة
// ============================================================

import dataManager from './data-manager.js';
import authService from './auth.js';
import firestoreService from './firestore-service.js';
import { shuffleArray, showToast } from './utils.js';

export class GameEngine {
    constructor() {
        this.currentIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 15;
        this.totalTime = 15;
        this.answered = false;
        this.gameQuestions = [];
        this.difficulty = 'medium';
        this.pointsPerQuestion = 2;
        this.isPlaying = false;
    }

    init() {
        document.getElementById('startGameBtn')?.addEventListener('click', () => this.start());
        document.getElementById('gameQuitBtn')?.addEventListener('click', () => this.quit());
        document.getElementById('gameReplayBtn')?.addEventListener('click', () => this.start());
        document.getElementById('gameHomeBtn')?.addEventListener('click', () => {
            document.querySelector('[data-section="dashboard"]')?.click();
        });
    }

    start() {
        if (this.isPlaying) return;
        const category = document.getElementById('gameCategory').value;
        const count = parseInt(document.getElementById('gameCount').value);
        const diff = document.getElementById('gameDifficulty').value;
        this.difficulty = diff;

        let pool = [...dataManager.data.questions];
        if (category !== 'all') {
            pool = pool.filter(q => q.category === category);
        }
        if (pool.length === 0) {
            showToast('لا توجد أسئلة في هذه الفئة! أضف بعض الأسئلة أولاً.', 'error');
            return;
        }
        pool = shuffleArray(pool);
        this.gameQuestions = pool.slice(0, Math.min(count, pool.length));
        if (this.gameQuestions.length === 0) {
            showToast('لا توجد أسئلة كافية!', 'error');
            return;
        }

        this.currentIndex = 0;
        this.score = 0;
        this.answered = false;
        this.isPlaying = true;

        const diffMap = {
            easy: { time: 20, points: 1 },
            medium: { time: 15, points: 2 },
            hard: { time: 10, points: 3 }
        };
        const settings = diffMap[this.difficulty] || diffMap.medium;
        this.totalTime = settings.time;
        this.pointsPerQuestion = settings.points;

        document.getElementById('gameStartScreen').style.display = 'none';
        document.getElementById('gamePlayScreen').style.display = 'block';
        document.getElementById('gameResultScreen').style.display = 'none';

        this.renderQuestion();
        this.startTimer();
    }

    renderQuestion() {
        const q = this.gameQuestions[this.currentIndex];
        if (!q) { this.endGame(); return; }
        this.answered = false;
        document.getElementById('gameQCounter').textContent =
            `${this.currentIndex + 1} / ${this.gameQuestions.length}`;
        document.getElementById('gameProgressFill').style.width =
            `${((this.currentIndex) / this.gameQuestions.length) * 100}%`;
        document.getElementById('gameScoreDisplay').textContent = `⭐ ${this.score}`;
        document.getElementById('gameQCategory').textContent = q.category || 'عام';
        document.getElementById('gameQText').textContent = q.question;

        const container = document.getElementById('gameOptions');
        container.innerHTML = '';
        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
            btn.dataset.index = idx;
            btn.addEventListener('click', () => this.selectOption(idx));
            container.appendChild(btn);
        });

        this.timeLeft = this.totalTime;
        document.getElementById('gameTimerDisplay').textContent = `⏱ ${this.timeLeft}s`;
    }

    selectOption(index) {
        if (this.answered || !this.isPlaying) return;
        this.answered = true;
        clearInterval(this.timer);

        const q = this.gameQuestions[this.currentIndex];
        const btns = document.querySelectorAll('.option-btn');
        btns.forEach((btn, i) => {
            btn.classList.add('disabled');
            if (i === q.correct) btn.classList.add('show-correct');
            if (i === index && i !== q.correct) btn.classList.add('selected-wrong');
            if (i === index && i === q.correct) btn.classList.add('selected-correct');
        });

        if (index === q.correct) {
            this.score += this.pointsPerQuestion;
            document.getElementById('gameScoreDisplay').textContent = `⭐ ${this.score}`;
        }

        setTimeout(() => {
            this.currentIndex++;
            if (this.currentIndex < this.gameQuestions.length) {
                this.renderQuestion();
                this.startTimer();
            } else {
                this.endGame();
            }
        }, 1200);
    }

    startTimer() {
        clearInterval(this.timer);
        this.timeLeft = this.totalTime;
        document.getElementById('gameTimerDisplay').textContent = `⏱ ${this.timeLeft}s`;
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('gameTimerDisplay').textContent = `⏱ ${this.timeLeft}s`;
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                if (!this.answered && this.isPlaying) {
                    this.answered = true;
                    const q = this.gameQuestions[this.currentIndex];
                    const btns = document.querySelectorAll('.option-btn');
                    btns.forEach((btn, i) => {
                        btn.classList.add('disabled');
                        if (i === q.correct) btn.classList.add('show-correct');
                    });
                    setTimeout(() => {
                        this.currentIndex++;
                        if (this.currentIndex < this.gameQuestions.length) {
                            this.renderQuestion();
                            this.startTimer();
                        } else {
                            this.endGame();
                        }
                    }, 1200);
                }
            }
        }, 1000);
    }

    async endGame() {
        this.isPlaying = false;
        clearInterval(this.timer);
        document.getElementById('gamePlayScreen').style.display = 'none';
        document.getElementById('gameResultScreen').style.display = 'block';
        const maxScore = this.gameQuestions.length * this.pointsPerQuestion;
        document.getElementById('resultFinalScore').textContent = `${this.score} / ${maxScore}`;
        const pct = this.gameQuestions.length > 0 ? (this.score / maxScore) * 100 : 0;
        let msg = '👏 ممتاز!';
        if (pct >= 80) msg = '🏆 رائع! أنت خبير!';
        else if (pct >= 60) msg = '👍 جيد جداً!';
        else if (pct >= 40) msg = '📖 تحتاج إلى المزيد من الممارسة';
        else msg = '💪 لا تستسلم! حاول مرة أخرى';
        document.getElementById('resultDetail').textContent = msg;

        if (authService.currentUser) {
            const name = authService.currentUser.username ||
                authService.currentUser.displayName ||
                authService.currentUser.email;
            try {
                await firestoreService.add('leaderboard', {
                    name: name,
                    score: this.score,
                    date: new Date().toISOString()
                });
                // تحديث لوحة المتصدرين عبر حدث
                document.dispatchEvent(new CustomEvent('renderTables', {
                    detail: dataManager.data
                }));
            } catch (e) {
                console.error('Error saving leaderboard:', e);
            }
        }

        let games = parseInt(localStorage.getItem('footballGamesPlayed') || '0');
        games++;
        localStorage.setItem('footballGamesPlayed', games);
        const stats = dataManager.getStats();
        document.getElementById('statGamesPlayed').textContent = games;
    }

    quit() {
        clearInterval(this.timer);
        this.isPlaying = false;
        if (confirm('هل تريد إنهاء اللعبة؟')) {
            document.getElementById('gamePlayScreen').style.display = 'none';
            document.getElementById('gameResultScreen').style.display = 'none';
            document.getElementById('gameStartScreen').style.display = 'block';
        } else {
            this.isPlaying = true;
            this.startTimer();
        }
    }
}

export const gameEngine = new GameEngine();