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

// Middleware function to verify ID token and retrieve idToken from the request
async function verifyIdToken(req, res, next) {
  const idToken = req.query.idToken;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    res.redirect("/login");
  }
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

      admin
        .auth()
        .createCustomToken(userRecord.uid)
        .then((customToken) => {
          res.redirect(`/dashboard?token=${customToken}`);
        })
        .catch((error) => {
          res.render("login", { error: error.message });
        });
    })
    .catch((error) => {
      res.render("register", { error: error.message });
    });
});

app.get("/login", (req, res) => {
  res.render("login", { error: null }); // pass in null as the default value for error
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Remove the signInWithEmailAndPassword call and replace it with createCustomToken
  admin
    .auth()
    .getUserByEmail(email)
    .then((userRecord) => {
      admin
        .auth()
        .createCustomToken(userRecord.uid)
        .then((customToken) => {
          res.redirect(`/dashboard?idToken=${customToken}`);
        })
        .catch((error) => {
          res.render("login", { error: error.message });
        });
    })
    .catch((error) => {
      res.render("login", { error: error.message });
    });
});


app.get("/dashboard", verifyIdToken, (req, res) => {
  const idToken = req.query.idToken;

  // Verify the user's ID token to authenticate the user
  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const userRef = db.ref("users/" + decodedToken.uid);
      userRef.once("value", (snapshot) => {
        const user = snapshot.val();
        res.render("dashboard", { user, idToken });
      });
    })
    .catch((error) => {
      res.redirect("/login");
    });
});


app.get('/data', verifyIdToken, (req, res) => {
  const dataRef = db.ref('data');
  dataRef.once('value', snapshot => {
    const data = snapshot.val();
    res.json(data);
  });
});

app.get("/logout", (req, res) => {
  res.redirect("/login");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
