// ============================================================
// firebase-config.js – إعدادات الاتصال بـ Firebase
// ============================================================

/**
 * ⚠️ مهم: استبدل هذه القيم بقيم مشروعك الفعلي من Firebase Console
 * انتقل إلى: https://console.firebase.google.com/project/_/settings/general/
 */
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuuiGi5XhEojPKgmWBGWJTG1sQHj630aQ",
  authDomain: "football-808ec.firebaseapp.com",
  projectId: "football-808ec",
  storageBucket: "football-808ec.firebasestorage.app",
  messagingSenderId: "331174502798",
  appId: "1:331174502798:web:bd0d3b476fd3e88ad9c4df",
  measurementId: "G-N24YLB4G4K"
};
// ===== تهيئة Firebase =====
let db = null;
let auth = null;
let isFirebaseReady = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    auth = firebase.auth();
    isFirebaseReady = true;
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    isFirebaseReady = false;
}

// ===== تصدير المتغيرات للاستخدام في الملفات الأخرى =====
export { db, auth, isFirebaseReady, firebaseConfig };