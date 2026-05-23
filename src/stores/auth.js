import { defineStore } from 'pinia';
import { ref } from 'vue';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(true);

  // Initialize the auth observer
  const init = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          user.value = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
          };
        } else {
          user.value = null;
        }
        loading.value = false;
        resolve(user.value);
      });
    });
  };

  // Google Login
  const loginWithGoogle = async () => {
    loading.value = true;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      user.value = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };
      return user.value;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // Logout
  const logout = async () => {
    loading.value = true;
    try {
      await signOut(auth);
      user.value = null;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    loading,
    init,
    loginWithGoogle,
    logout,
  };
});
