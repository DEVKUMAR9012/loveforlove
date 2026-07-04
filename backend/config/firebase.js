const { initializeApp, cert, getApps } = require('firebase-admin/app');
const fs = require('fs');
const path = require('path');

try {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii')
      );
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      const keyPath = path.join(__dirname, '../serviceAccountKey.json');
      if (fs.existsSync(keyPath)) {
        const serviceAccount = require(keyPath);
        initializeApp({
          credential: cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully.");
      } else {
        console.warn("⚠️ Firebase Admin initialization skipped. Please place serviceAccountKey.json in the backend root.");
      }
    }
  }
} catch (error) {
  console.error("Firebase admin init error:", error);
}

// We just require this file to initialize the app
module.exports = {};
