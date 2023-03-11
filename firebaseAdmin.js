const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
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