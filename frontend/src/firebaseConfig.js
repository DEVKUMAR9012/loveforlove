import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Facebook Provider — requests real name + profile picture
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
facebookProvider.setCustomParameters({ display: 'popup' });

// Instagram uses Facebook Login (Meta owns Instagram)
// Real Instagram OAuth requires Instagram Basic Display API approval
export const instagramProvider = facebookProvider;
