import { firebaseApp } from "./firebase-app";
import { getFirestore } from "firebase/firestore";

const firestore = getFirestore(firebaseApp);
export { firestore };
