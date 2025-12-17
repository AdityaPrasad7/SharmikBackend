import admin from "firebase-admin";
import { serviceAccount } from "./shramik-b3b55-firebase-adminsdk-fbsvc-95e665e417.js";

// Initialize Firebase Admin SDK
let firebaseApp;

const initializeFirebase = () => {
    if (!admin.apps.length) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin SDK initialized successfully");
    } else {
        firebaseApp = admin.app();
    }
    return firebaseApp;
};

// Initialize on import
initializeFirebase();

// Export messaging instance
export const messaging = admin.messaging();

export { admin };
export default firebaseApp;
