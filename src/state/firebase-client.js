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

let _client = null;
let _listenerAdded = false;

export function createFirebaseClient(firebaseConfig) {
    if (_client) return _client;

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    async function loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("✅ User logged in:", user.displayName);
            await syncLocalToCloud(user.uid);
            return user;
        } catch (error) {
            console.error("❌ Login Error:", error);
            throw error;
        }
    }

    async function signupWithEmail(name, email, password) {
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

    async function loginWithEmail(email, password) {
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

    async function logoutUser() {
        try {
            await signOut(auth);
            console.log("👋 User logged out");
            window.location.href = 'index.html';
        } catch (error) {
            console.error("❌ Logout Error:", error);
        }
    }

    function onUserChange(callback) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                syncLocalToCloud(user.uid);
            }
            callback(user);
        });
    }

    async function saveResult(data) {
        const user = auth.currentUser;
        saveToLocalStorage({
            ...data,
            synced: !!user 
        });

        if (user) {
            try {
                await addDoc(collection(db, "users", user.uid, "calculations"), {
                    ...data,
                    timestamp: serverTimestamp()
                });
                console.log("☁️ Saved to Firestore");
                return true;
            } catch (e) {
                console.error("❌ Firestore Save Error:", e);
                updateLocalStatus(data, false);
                throw e;
            }
        }
        return true;
    }

    async function fetchResults() {
        const user = auth.currentUser;
        let localResults = JSON.parse(localStorage.getItem('savedResults') || '[]');
        
        if (user) {
            try {
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

                const unSyncedLocal = localResults.filter(r => !r.synced);
                const combined = [...cloudResults, ...unSyncedLocal];
                combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                return combined;
            } catch (e) {
                console.error("❌ Firestore Fetch Error:", e);
                return localResults;
            }
        } else {
            localResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return localResults;
        }
    }

    async function syncLocalToCloud(userId) {
        let localData = JSON.parse(localStorage.getItem('savedResults') || '[]');
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
            const updatedLocal = localData.map(item => ({ ...item, synced: true }));
            localStorage.setItem('savedResults', JSON.stringify(updatedLocal));

            if(window.reloadSavedResults) {
                window.reloadSavedResults();
            }
        } catch (e) {
            console.error("❌ Sync failed", e);
        }
    }

    async function deleteResult(timestamp, cloudId = null) {
        let localData = JSON.parse(localStorage.getItem('savedResults') || '[]');
        const updatedLocal = localData.filter(item => item.timestamp !== timestamp);
        localStorage.setItem('savedResults', JSON.stringify(updatedLocal));
        console.log("🗑️ Deleted from LocalStorage");

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

    function saveToLocalStorage(data) {
        let saved = JSON.parse(localStorage.getItem('savedResults') || '[]');
        if (!data.timestamp) data.timestamp = new Date().toISOString();
        saved.push(data);
        localStorage.setItem('savedResults', JSON.stringify(saved));
        console.log("💾 Saved to LocalStorage");
    }

    function updateLocalStatus(data, status) {
        let saved = JSON.parse(localStorage.getItem('savedResults') || '[]');
        if (saved.length > 0) {
            saved[saved.length - 1].synced = status;
            localStorage.setItem('savedResults', JSON.stringify(saved));
        }
    }

    if (!_listenerAdded) {
        window.addEventListener('online', () => {
            console.log("🌐 Internet is back! Syncing...");
            if (auth.currentUser) syncLocalToCloud(auth.currentUser.uid);
        });
        _listenerAdded = true;
    }

    _client = {
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logoutUser,
        onUserChange,
        saveResult,
        fetchResults,
        deleteResult,
        getCurrentUser: () => auth.currentUser,
        syncLocalToCloud: (userId) => syncLocalToCloud(userId),
    };

    return _client;
}

export async function loginWithGoogle(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.loginWithGoogle(...args);
}

export async function signupWithEmail(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.signupWithEmail(...args);
}

export async function loginWithEmail(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.loginWithEmail(...args);
}

export async function logoutUser(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.logoutUser(...args);
}

export function onUserChange(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.onUserChange(...args);
}

export async function saveResult(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.saveResult(...args);
}

export async function fetchResults(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.fetchResults(...args);
}

export async function deleteResult(...args) {
    if (!_client) throw new Error('Firebase client not initialized. Call createFirebaseClient() first.');
    return _client.deleteResult(...args);
}
