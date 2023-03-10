const { initializeApp } = require('firebase/app');
const admin = require("firebase-admin");
const express = require("express");

const port = process.env.PORT || 3000;

const firebaseConfig = {
  apiKey: "AIzaSyCUPMErBXb1hF_hW-iWeuRBhdoUmfCl-aI",
  authDomain: "storks-4753a.firebaseapp.com",
  projectId: "storks-4753a",
  storageBucket: "storks-4753a.appspot.com",
  messagingSenderId: "260702009309",
  appId: "1:260702009309:web:3ab621d4c28e89ed1ea834",
  measurementId: "G-ZKEHRFVBM4",
};

const firebase = initializeApp(firebaseConfig);
    
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(() => {
      res.redirect("/dashboard");
    })
    .catch((error) => {
      res.render("register", { error: error.message });
    });
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      res.redirect("/dashboard");
    })
    .catch((error) => {
      res.render("login", { error: error.message });
    });
});

app.get("/dashboard", (req, res) => {
  const user = firebase.auth().currentUser;

  if (user) {
    res.render("dashboard", { user: user });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      res.redirect("/login");
    })
    .catch((error) => {
      console.log(error.message);
      res.redirect("/dashboard");
    });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
