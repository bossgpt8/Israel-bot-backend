import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgPu2vu1QeH76l7CLuJXQxzpsmuOfGjpM",
  authDomain: "boss-bot-b3858.firebaseapp.com",
  projectId: "boss-bot-b3858",
  storageBucket: "boss-bot-b3858.firebasestorage.app",
  messagingSenderId: "626207302410",
  appId: "1:626207302410:web:9599d4fafe9937d0e990f3",
  measurementId: "G-64QBPYVFVL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, pass: string, name: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(result.user, { displayName: name });
  
  await setDoc(doc(db, "users", result.user.uid), {
    email: result.user.email,
    displayName: name,
    lastLogin: serverTimestamp(),
  }, { merge: true });
  
  return result.user;
}

export async function loginWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function getUserBotSession(userId: string) {
  try {
    const docRef = doc(db, "botSessions", userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting bot session:", error);
    return null;
  }
}

export async function saveBotSession(userId: string, sessionData: any) {
  try {
    await setDoc(doc(db, "botSessions", userId), {
      ...sessionData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error saving bot session:", error);
    throw error;
  }
}

export { onAuthStateChanged, type User };
