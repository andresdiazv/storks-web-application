const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const idToken = req.query.idToken;

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const userRef = db.ref("users/" + decodedToken.uid);

      userRef.once("value", (snapshot) => {
        const user = snapshot.val();

        if (user) {
          res.render("dashboard", { user: user });
        } else {
          res.redirect("/login");
        }
      });
    })
    .catch((error) => {
      res.redirect("/login");
    });
});

module.exports = router;
