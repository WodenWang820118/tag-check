import { getStorage } from "firebase/storage";
import { firebaseApp } from "./firebase-app";
const bucket = getStorage(firebaseApp);
export { bucket };
