// ============================================================
// auth.js – نظام المصادقة المتقدم
// ============================================================

import { auth, db, isFirebaseReady } from './firebase-config.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this._listeners = [];
        this._initialized = false;
    }

    async init() {
        if (this._initialized) return this.currentUser;
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        return new Promise((resolve) => {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    await this._fetchUserData(user);
                } else {
                    this.currentUser = null;
                }
                this._initialized = true;
                this._notifyListeners();
                resolve(this.currentUser);
            });
        });
    }

    async _fetchUserData(user) {
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            const data = doc.exists ? doc.data() : {};
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || data.displayName || user.email,
                username: data.username || user.displayName || user.email,
                role: data.role || 'editor',
                photoURL: user.photoURL || data.photoURL || null,
                createdAt: data.createdAt || null
            };
        } catch (error) {
            console.warn('Could not fetch user data:', error);
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email,
                username: user.displayName || user.email,
                role: 'editor'
            };
        }
    }

    async login(email, password) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        try {
            const cred = await auth.signInWithEmailAndPassword(email, password);
            await this._fetchUserData(cred.user);
            this._notifyListeners();
            return this.currentUser;
        } catch (error) {
            throw new Error(this._getErrorMessage(error));
        }
    }

    async register(email, password, username, displayName = null) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        try {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            const finalDisplayName = displayName || username;
            await cred.user.updateProfile({ displayName: finalDisplayName });
            await db.collection('users').doc(cred.user.uid).set({
                email: email,
                username: username,
                displayName: finalDisplayName,
                role: 'editor',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            this.currentUser = {
                uid: cred.user.uid,
                email: email,
                displayName: finalDisplayName,
                username: username,
                role: 'editor'
            };
            this._notifyListeners();
            return this.currentUser;
        } catch (error) {
            throw new Error(this._getErrorMessage(error));
        }
    }

    async logout() {
        if (!isFirebaseReady) return;
        await auth.signOut();
        this.currentUser = null;
        this._notifyListeners();
    }

    async changePassword(newPassword) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        if (!auth.currentUser) throw new Error('No user logged in');
        await auth.currentUser.updatePassword(newPassword);
    }

    async updateUserProfile(data) {
        if (!isFirebaseReady) throw new Error('Firebase not ready');
        if (!this.currentUser) throw new Error('No user logged in');
        await db.collection('users').doc(this.currentUser.uid).update(data);
        Object.assign(this.currentUser, data);
        this._notifyListeners();
        return this.currentUser;
    }

    checkPermission(requiredRole) {
        if (!this.currentUser) return false;
        if (requiredRole === 'admin') return this.currentUser.role === 'admin';
        if (requiredRole === 'editor') {
            return this.currentUser.role === 'admin' || this.currentUser.role === 'editor';
        }
        return true;
    }

    addListener(callback) {
        this._listeners.push(callback);
        if (this.currentUser) callback(this.currentUser);
        return () => {
            this._listeners = this._listeners.filter(cb => cb !== callback);
        };
    }

    _notifyListeners() {
        this._listeners.forEach(cb => cb(this.currentUser));
    }

    _getErrorMessage(error) {
        const errors = {
            'auth/user-not-found': 'المستخدم غير موجود',
            'auth/wrong-password': 'كلمة المرور غير صحيحة',
            'auth/email-already-in-use': 'البريد الإلكتروني مستخدم مسبقاً',
            'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
            'auth/weak-password': 'كلمة المرور ضعيفة (6 أحرف على الأقل)',
            'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقاً',
            'auth/network-request-failed': 'فشل الاتصال بالإنترنت',
            'auth/api-key-not-valid': 'مفتاح API غير صحيح، تحقق من إعدادات Firebase',
            'auth/invalid-api-key': 'مفتاح API غير صحيح',
            'auth/requires-recent-login': 'يجب تسجيل الدخول مرة أخرى'
        };
        return errors[error.code] || error.message || 'حدث خطأ غير متوقع';
    }
}

const authService = new AuthService();
export default authService;