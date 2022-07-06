import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVqcYvb-P-A11T3rZoi8pWT3SzHBNYLN4",
  authDomain: "football-prediction-6aae3.firebaseapp.com",
  projectId: "football-prediction-6aae3",
  storageBucket: "football-prediction-6aae3.appspot.com",
  messagingSenderId: "682611799154",
  appId: "1:682611799154:web:405e8f2b0acd80d894feeb"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
