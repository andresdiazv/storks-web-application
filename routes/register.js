const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render("register", { error: null });
});

router.post('/', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  admin
    .auth()
    .createUser({
      email: email,
      password: password,
    })
    .then((userRecord) => {
      // Create a reference to the user's data in the database
      const userRef = db.ref("users/" + userRecord.uid);

      // Save the user's data to the database
      userRef.set({
        email: userRecord.email,
        uid: userRecord.uid,
        // Add more properties here as needed
      });

      admin.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        userCredential.user.getIdToken().then((idToken) => {
          res.render("dashboard", { idToken: idToken });
        });
      })
      .catch((error) => {
        res.render("login", { error: error.message });
      });
    })
    .catch((error) => {
      res.render("register", { error: error.message });
    });
});

module.exports = router;
