import { app } from './firebase';
import { getFirestore } from 'firebase/firestore';

const firestore = getFirestore(app);
export { firestore };
