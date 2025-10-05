import { app } from './firebase';
import { getAuth } from 'firebase/auth';

const auth = getAuth(app);

export { auth };
