const admin = require("firebase-admin");
const express = require("express");
const serviceAccount = require("./serviceAccountKey.json");

const app = express();
const port = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storks-4753a-default-rtdb.firebaseio.com",
});

const db = admin.database();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

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

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", (req, res) => {
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
          res.redirect(`/dashboard?idToken=${idToken}`);
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

app.get('/login', (req, res) => {
  res.render('login', { error: null }); // pass in null as the default value for error
});

app.post("/login", verifyIdToken, (req, res) => {
  const idToken = req.idToken;

  res.redirect(`/dashboard?idToken=${idToken}`);
});

app.get("/dashboard", (req, res) => {
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
app.get("/logout", (req, res) => {
  res.redirect("/login");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
