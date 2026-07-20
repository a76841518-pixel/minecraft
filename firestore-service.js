// ============================================================
// firestore-service.js – عمليات قاعدة البيانات المتقدمة
// ============================================================

import { db, isFirebaseReady } from './firebase-config.js';

class FirestoreService {
    constructor() {
        this._listeners = new Map();
        this._cache = new Map();
        this._cacheTTL = 5 * 60 * 1000;
    }

    async add(collection, data) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        const ref = db.collection(collection);
        const docRef = await ref.add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        this._invalidateCache(collection);
        return { id: docRef.id, ...data };
    }

    async update(collection, id, data) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        await db.collection(collection).doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        this._invalidateCache(collection);
        return { id, ...data };
    }

    async delete(collection, id) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        await db.collection(collection).doc(id).delete();
        this._invalidateCache(collection);
    }

    async get(collection, id) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        const doc = await db.collection(collection).doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    }

    async getAll(collection, orderBy = 'createdAt', direction = 'desc') {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        const cacheKey = `${collection}:${orderBy}:${direction}`;
        const cached = this._getCache(cacheKey);
        if (cached) return cached;
        try {
            const snapshot = await db.collection(collection)
                .orderBy(orderBy, direction)
                .get();
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            this._setCache(cacheKey, results);
            return results;
        } catch (error) {
            console.warn(`⚠️ Could not order by ${orderBy}, falling back.`);
            const snapshot = await db.collection(collection).get();
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            this._setCache(cacheKey, results);
            return results;
        }
    }

    listen(collection, callback, orderBy = 'createdAt', direction = 'desc') {
        if (!isFirebaseReady) return () => {};
        const key = `${collection}:${orderBy}:${direction}`;
        if (this._listeners.has(key)) {
            this._listeners.get(key)();
        }
        let unsubscribe;
        try {
            unsubscribe = db.collection(collection)
                .orderBy(orderBy, direction)
                .onSnapshot((snapshot) => {
                    const results = [];
                    snapshot.forEach(doc => {
                        results.push({ id: doc.id, ...doc.data() });
                    });
                    this._setCache(key, results);
                    callback(results);
                }, (error) => {
                    console.error('Listen error:', error);
                    const fallback = db.collection(collection).onSnapshot((snap) => {
                        const results = [];
                        snap.forEach(doc => {
                            results.push({ id: doc.id, ...doc.data() });
                        });
                        this._setCache(key, results);
                        callback(results);
                    });
                    this._listeners.set(key, fallback);
                });
        } catch (error) {
            console.error('Listen setup error:', error);
            const fallback = db.collection(collection).onSnapshot((snap) => {
                const results = [];
                snap.forEach(doc => {
                    results.push({ id: doc.id, ...doc.data() });
                });
                this._setCache(key, results);
                callback(results);
            });
            this._listeners.set(key, fallback);
            return () => fallback();
        }
        this._listeners.set(key, unsubscribe);
        return () => {
            if (this._listeners.has(key)) {
                this._listeners.get(key)();
                this._listeners.delete(key);
            }
        };
    }

    async importData(data) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        const collections = ['players', 'clubs', 'matches', 'tournaments', 'questions', 'leaderboard'];
        const batch = db.batch();
        for (const col of collections) {
            if (data[col] && Array.isArray(data[col])) {
                const snapshot = await db.collection(col).get();
                snapshot.forEach(doc => batch.delete(doc.ref));
                for (const item of data[col]) {
                    const ref = db.collection(col).doc();
                    batch.set(ref, {
                        ...item,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        }
        await batch.commit();
        this._invalidateCache();
    }

    async exportData() {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        const collections = ['players', 'clubs', 'matches', 'tournaments', 'questions', 'leaderboard'];
        const result = {};
        for (const col of collections) {
            result[col] = await this.getAll(col);
        }
        return result;
    }

    async resetAll() {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        const collections = ['players', 'clubs', 'matches', 'tournaments', 'questions', 'leaderboard'];
        const batch = db.batch();
        for (const col of collections) {
            const snapshot = await db.collection(col).get();
            snapshot.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit();
        this._invalidateCache();
    }

    _getCache(key) {
        const entry = this._cache.get(key);
        if (entry && Date.now() - entry.timestamp < this._cacheTTL) {
            return entry.data;
        }
        return null;
    }
    _setCache(key, data) {
        this._cache.set(key, { data, timestamp: Date.now() });
    }
    _invalidateCache(collection = null) {
        if (collection) {
            for (const key of this._cache.keys()) {
                if (key.startsWith(collection)) this._cache.delete(key);
            }
        } else {
            this._cache.clear();
        }
    }
}

const firestoreService = new FirestoreService();
export default firestoreService;