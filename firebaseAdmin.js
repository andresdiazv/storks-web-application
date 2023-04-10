/*
  Initializes Firabse Admin SDK with service account credentials.
  Sets up the authetication module to be used in the application. 
*/

// provides administrative access to Firebase projects
const admin = require("firebase-admin");
// service account credentials assigned to constant
const serviceAccount = require("./serviceAccountKey.json");
// initializes the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// sets up the Firebase Authentication module
const auth = admin.auth();

// const firebaseConfig = {
//   apiKey: "AIzaSyCUPMErBXb1hF_hW-iWeuRBhdoUmfCl-aI",
//   authDomain: "storks-4753a.firebaseapp.com",
//   projectId: "storks-4753a",
//   storageBucket: "storks-4753a.appspot.com",
//   messagingSenderId: "260702009309",
//   appId: "1:260702009309:web:3ab621d4c28e89ed1ea834",
//   measurementId: "G-ZKEHRFVBM4",
// };