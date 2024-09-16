import { getAuth } from "firebase/auth";
import { firebaseApp } from "./firebase-app";
const auth = getAuth(firebaseApp);
export { auth };
