const express = require('express');
const router = express.Router();

// Middleware function to verify ID token and retrieve idToken from the Realtime Database
function verifyIdToken(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  admin
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      userCredential.user.getIdToken().then((idToken) => {
        req.idToken = idToken;
        next();
      });
    })
    .catch((error) => {
      res.render("login", { error: error.message });
    });
}

router.get('/', (req, res) => {
  res.render('login', { email: '' }); // pass in an empty string as the default value for email
});

router.post('/', verifyIdToken, (req, res) => {
  const idToken = req.idToken;

  res.render("dashboard", { idToken: idToken });
});

router.get("/logout", (req, res) => {
  res.redirect("/login");
});

module.exports = router;
