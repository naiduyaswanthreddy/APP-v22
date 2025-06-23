import { browserLocalPersistence, setPersistence } from 'firebase/auth';
import { auth } from './firebase';

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });