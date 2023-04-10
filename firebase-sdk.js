/* 
   Imports the Firebase SDK, specifically modules for  
  'app' and 'auth'. Allows use of methods and classes 
   to manage user authentication and authorization within 
   application. Can import Firebase SDK into other modules 
   using statement:
   'import firebase from 'Path2D.apply.call.firebase-sdk.js' 
*/

// Import Firebase SDK

// imports 'app' module
import firebase from "firebase/app";
// imports 'auth' module
import "firebase/auth";
// allows import into other modules using:
export default firebase;
