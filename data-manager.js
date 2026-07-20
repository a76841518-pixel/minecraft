// ============================================================
// data-manager.js – إدارة البيانات المركزية
// ============================================================

import firestoreService from './firestore-service.js';

class DataManager {
    constructor() {
        this.data = {
            players: [],
            clubs: [],
            matches: [],
            tournaments: [],
            questions: [],
            leaderboard: []
        };
        this._listeners = [];
        this._initialized = false;
        this._unsubscribers = [];
    }

    async loadAll() {
        try {
            const collections = ['players', 'clubs', 'matches', 'tournaments', 'questions', 'leaderboard'];
            const results = await Promise.all(
                collections.map(col => firestoreService.getAll(col))
            );
            collections.forEach((col, idx) => {
                this.data[col] = results[idx];
            });
            this._initialized = true;
            this._notifyListeners();
            return this.data;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            throw error;
        }
    }

    startListening() {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
        const collections = [
            { name: 'players', key: 'players' },
            { name: 'clubs', key: 'clubs' },
            { name: 'matches', key: 'matches' },
            { name: 'tournaments', key: 'tournaments' },
            { name: 'questions', key: 'questions' },
            { name: 'leaderboard', key: 'leaderboard' }
        ];
        collections.forEach(({ name, key }) => {
            const unsub = firestoreService.listen(name, (data) => {
                this.data[key] = data;
                this._notifyListeners();
            });
            this._unsubscribers.push(unsub);
        });
    }

    stopListening() {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
    }

    addListener(callback) {
        this._listeners.push(callback);
        if (this._initialized) callback(this.data);
        return () => {
            this._listeners = this._listeners.filter(cb => cb !== callback);
        };
    }

    _notifyListeners() {
        this._listeners.forEach(cb => cb(this.data));
    }

    async add(collection, item) {
        return await firestoreService.add(collection, item);
    }

    async update(collection, id, item) {
        return await firestoreService.update(collection, id, item);
    }

    async delete(collection, id) {
        await firestoreService.delete(collection, id);
    }

    getFiltered(collection, filters = {}) {
        let items = [...this.data[collection] || []];
        for (const [key, value] of Object.entries(filters)) {
            if (value) {
                items = items.filter(item => {
                    const itemValue = item[key];
                    if (typeof itemValue === 'string') {
                        return itemValue.toLowerCase().includes(value.toLowerCase());
                    }
                    return itemValue === value;
                });
            }
        }
        return items;
    }

    getStats() {
        return {
            players: this.data.players.length,
            clubs: this.data.clubs.length,
            matches: this.data.matches.length,
            tournaments: this.data.tournaments.length,
            questions: this.data.questions.length,
            leaderboard: this.data.leaderboard.length
        };
    }

    async exportData() {
        return await firestoreService.exportData();
    }

    async importData(data) {
        await firestoreService.importData(data);
        await this.loadAll();
    }

    async resetAll() {
        await firestoreService.resetAll();
        await this.loadAll();
    }
}

const dataManager = new DataManager();
export default dataManager;