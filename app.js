const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const multer = require("multer");
const app = express();
const bcrypt = require("bcrypt");
const { Storage } = require('@google-cloud/storage');
const saltRounds = 10;

const path = require("path");

const initializePassport = require("./passportConfig");
initializePassport(passport);

const port = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storks-4753a-default-rtdb.firebaseio.com",
  storageBucket: "storks-4753a.appspot.com",
});

const storage = new Storage({
  projectId: "storks-4753a",
  keyFilename: "./serviceAccountKey.json",
});

const db = admin.database();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "secret",

    resave: false,

    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      res.status(500).send("Error hashing password");
      return;
    }

    admin
      .auth()
      .createUser({
        email: email,
        password: password,
      })
      .then((userRecord) => {
        const userRef = db.ref("users/" + userRecord.uid);

        userRef.set({
          name: name,
          email: userRecord.email,
          password: hashedPassword,
          uid: userRecord.uid,
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
});

app.get("/login", (req, res) => {
  let message = req.flash("error")[0];
  res.render("login", { message });
});

app.get("/login", (req, res) => {
  let message = req.flash("error")[0];
  res.render("login", { message });
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    const userId = req.user.uid;

    db.ref(`users/${userId}`)
      .once("value")
      .then((snapshot) => {
        const userData = snapshot.val();
        res.render("dashboard", { user: userData });
      })
      .catch((error) => {
        console.error("Error retrieving user data:", error);
        res.status(500).send("Error retrieving user data");
      });
  } else {
    res.redirect("/login");
  }
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.get("/profile-page", checkAuthenticated, (req, res) => {
  const userId = req.user.uid;

  db.ref(`users/${userId}`)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val();
      res.render("profile-page", { user: userData });
    })
    .catch((error) => {
      console.error("Error retrieving user data:", error);
      res.status(500).send("Error retrieving user data");
    });
});


app.get("/favors-page", (req, res) => {
  res.render("favors-page");
});

app.get("/logout", (req, res) => {
  res.redirect("/login");
});

app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.get('/create-task', function(req, res) {
  // Handle the request and render the appropriate view
});

app.get("/favor-popup1", (req, res) => {
  res.render("favor-popup1");
});