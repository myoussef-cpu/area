import { createFirebaseClient, loginWithGoogle, loginWithEmail, signupWithEmail, logoutUser, onUserChange, saveResult, fetchResults, deleteResult } from './firebase-client.js';
import { firebaseConfig } from './firebase-config.js';

const client = createFirebaseClient(firebaseConfig);

window.firebaseLogic = {
    loginWithGoogle, loginWithEmail, signupWithEmail, logoutUser,
    onUserChange, saveResult, fetchResults, deleteResult,
    getCurrentUser: () => client.getCurrentUser(),
    syncLocalToCloud: (uid) => client.syncLocalToCloud(uid)
};

export { loginWithGoogle, loginWithEmail, signupWithEmail, logoutUser, onUserChange, saveResult, fetchResults, deleteResult };
