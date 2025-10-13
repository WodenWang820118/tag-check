import { app } from './firebase';
import { getStorage } from 'firebase/storage';

const bucket = getStorage(app);
export { bucket };
