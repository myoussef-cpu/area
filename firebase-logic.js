import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc,
    doc,
    query, 
    where, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// تهيئة Firebase يا معلم
let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("🔥 Firebase initialized successfully!");
} catch (error) {
    console.error("❌ Firebase init error. Did you update firebase-config.js?", error);
}

const provider = new GoogleAuthProvider();

// 1. دالة تسجيل الدخول بجوجل
export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("✅ User logged in:", user.displayName);
        
        // بعد ما يسجل، نعمل مزامنة للبيانات اللي كانت على الجهاز
        await syncLocalToCloud(user.uid);
        
        return user;
    } catch (error) {
        console.error("❌ Login Error:", error);
        throw error;
    }
}

// 2. دالة التسجيل بالبريد الإلكتروني (بدون تحقق)
export async function signupWithEmail(name, email, password) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        console.log("✅ User signed up:", name);
        await syncLocalToCloud(result.user.uid);
        return result.user;
    } catch (error) {
        console.error("❌ Signup Error:", error);
        throw error;
    }
}

// 3. دالة تسجيل الدخول بالبريد الإلكتروني
export async function loginWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ User logged in:", result.user.email);
        await syncLocalToCloud(result.user.uid);
        return result.user;
    } catch (error) {
        console.error("❌ Login Error:", error);
        throw error;
    }
}

// 4. دالة تسجيل الخروج
export async function logoutUser() {
    try {
        await signOut(auth);
        console.log("👋 User logged out");
        window.location.href = 'index.html';
    } catch (error) {
        console.error("❌ Logout Error:", error);
    }
}

// 3. مراقبة حالة المستخدم (عشان نعرف هو مسجل ولا لأ)
export function onUserChange(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // أول ما يسجل دخول أو يفتح وهو مسجل، نعمل مزامنة
            syncLocalToCloud(user.uid);
        }
        callback(user);
    });
}

// 4. حفظ نتيجة (دائماً محلياً، ولو مسجل يرفع للسحابة كمان)
export async function saveResult(data) {
    const user = auth.currentUser;
    
    // أولاً: احفظ محلياً دائماً عشان الأمان والسرعة
    // لو المستخدم مسجل، بنعلم على الداتا إنها "مرفوعة" عشان المزامنة متكررهاش
    saveToLocalStorage({
        ...data,
        synced: !!user 
    });

    if (user) {
        // ثانياً: ارفع على السحابة لو فيه يوزر
        try {
            await addDoc(collection(db, "users", user.uid, "calculations"), {
                ...data,
                timestamp: serverTimestamp()
            });
            console.log("☁️ Saved to Firestore");
            return true;
        } catch (e) {
            console.error("❌ Firestore Save Error:", e);
            // لو فشل الرفع، هنخليها "غير متزامنة" في المحلي عشان تترفع بعدين
            updateLocalStatus(data, false);
            throw e;
        }
    }
    return true;
}

// دالة مساعدة للحفظ المحلي
function saveToLocalStorage(data) {
    let saved = JSON.parse(localStorage.getItem('savedResults') || '[]');
    if (!data.timestamp) data.timestamp = new Date().toISOString();
    saved.push(data);
    localStorage.setItem('savedResults', JSON.stringify(saved));
    console.log("💾 Saved to LocalStorage");
}

// تحديث حالة المزامنة في المحلي لو الرفع فشل أو نجح
function updateLocalStatus(data, status) {
    let saved = JSON.parse(localStorage.getItem('savedResults') || '[]');
    // بنجيب آخر عنصر اللي هو لسه مضاف
    if (saved.length > 0) {
        saved[saved.length - 1].synced = status;
        localStorage.setItem('savedResults', JSON.stringify(saved));
    }
}

// 5. جلب النتائج
export async function fetchResults() {
    const user = auth.currentUser;
    let localResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
    
    if (user) {
        // هات من السحابة
        try {
            // بنجرب نجيب الداتا مترتبة، ولو فشلت (عشان الـ index مثلاً) نجيبها عادية
            let q;
            try {
                q = query(
                    collection(db, "users", user.uid, "calculations"), 
                    orderBy("timestamp", "desc")
                );
            } catch (e) {
                console.warn("⚠️ OrderBy failed, fetching without sort", e);
                q = collection(db, "users", user.uid, "calculations");
            }
            
            const querySnapshot = await getDocs(q);
            const cloudResults = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate().toISOString() : doc.data().timestamp,
                fromCloud: true
            }));

            // دمج المحلي مع السحابي مع مسح المتكرر
            // القاعدة: السحابي هو الأساس، والمحلي اللي مش "synced" يتضاف عليه
            const unSyncedLocal = localResults.filter(r => !r.synced);
            const combined = [...cloudResults, ...unSyncedLocal];
            
            // ترتيب نهائي
            combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return combined;
        } catch (e) {
            console.error("❌ Firestore Fetch Error:", e);
            return localResults; // لو السحابة وقعت، رجع المحلي
        }
    } else {
        // هات من المحلي بس
        localResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return localResults;
    }
}

// 6. المزامنة الذكية
async function syncLocalToCloud(userId) {
    let localData = JSON.parse(localStorage.getItem('savedResults') || '[]');
    
    // المزامنة فقط للحاجات اللي مش "synced"
    const toSync = localData.filter(item => !item.synced);
    
    if (toSync.length === 0) {
        console.log("✅ Everything is already synced");
        return;
    }

    console.log(`🔄 Syncing ${toSync.length} items to cloud...`);
    
    const promises = toSync.map(item => {
        const { id, synced, ...dataToSave } = item;
        const timestamp = item.timestamp ? new Date(item.timestamp) : serverTimestamp();
        
        return addDoc(collection(db, "users", userId, "calculations"), {
            ...dataToSave,
            timestamp: timestamp
        });
    });

    try {
        await Promise.all(promises);
        console.log("✅ Sync Complete!");
        
        // بعد المزامنة، بنعلم على كله إنه بقا synced في المحلي
        const updatedLocal = localData.map(item => ({ ...item, synced: true }));
        localStorage.setItem('savedResults', JSON.stringify(updatedLocal));

        if(window.reloadSavedResults) {
            window.reloadSavedResults();
        }
    } catch (e) {
        console.error("❌ Sync failed", e);
    }
}

// 7. حذف نتيجة
export async function deleteResult(timestamp, cloudId = null) {
    // حذف من المحلي
    let localData = JSON.parse(localStorage.getItem('savedResults') || '[]');
    const updatedLocal = localData.filter(item => item.timestamp !== timestamp);
    localStorage.setItem('savedResults', JSON.stringify(updatedLocal));
    console.log("🗑️ Deleted from LocalStorage");

    // لو ليها ID في السحابة ومسجل دخول، احذف من هناك كمان
    const user = auth.currentUser;
    if (user && cloudId) {
        try {
            await deleteDoc(doc(db, "users", user.uid, "calculations", cloudId));
            console.log("☁️ Deleted from Firestore");
        } catch (e) {
            console.error("❌ Firestore Delete Error:", e);
            throw e;
        }
    }
    return true;
}

// تصدير للنافذة (Window) عشان نسهل الاستخدام في كل حتة
window.firebaseLogic = {
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logoutUser,
    onUserChange,
    saveResult,
    fetchResults,
    deleteResult,
    syncLocalToCloud: () => auth.currentUser ? syncLocalToCloud(auth.currentUser.uid) : null,
    getCurrentUser: () => auth.currentUser
};

// مراقبة الاتصال بالإنترنت للمزامنة التلقائية
window.addEventListener('online', () => {
    console.log("🌐 Internet is back! Syncing...");
    if (auth.currentUser) syncLocalToCloud(auth.currentUser.uid);
});

export { auth, db };
