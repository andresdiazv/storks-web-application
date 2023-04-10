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
const funcs = require("functions.js");

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
  var registerUser = registerUser(email, password, email);
  if (registerUser == 1){
    res.status(500).send("Error hashing password");
  }
  else{
    
  }

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


app.get("/favors", (req, res) => {
  res.render("favors");
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

app.get("/profile-page", (req, res) => {
  res.render("profile-page");
});

// populate favors page
app.get("/favors", (req, res) => {
  res.render("favors");
});


function newFavor(db, userID, scheduled_date, title, details) {
  db.ref('/favors').set({
    user_requested: userID,
    user_assigned: null,
    scheduled_date: scheduled_date,
    completed_date: null,
    title: title,
    details: details
  });
}

function acceptFavorRequest(db, favorID, userID){
  db.ref('/favors' + favorID).set({
    user_assigned: userID
  })
}

function completeFavor(db, favorID){
  var today = new Date();
  db.ref('/favors' + favorID).set({
    completed_date: today
  })
}

function getDatabaseSnapshot(db, path_to_data) {
  const databaseRef = db.ref(path_to_data);
  databaseRef.once('value')
    .then((snapshot) => {
      const userData = snapshot.val();
      res.render("profile-page", { user: userData });
      const data = snapshot.val();
    })
  app.get("/favors-page", (req, res) => {
  res.render("favors-page");
  });
  return data;
}

// populate favor's page
var favorsRef = db.ref('favors');

// Define an array to store the retrieved favors data
var favorsArray = [];

// Retrieve the favors data from your database
favorsRef.once('value', function(snapshot) {
  snapshot.forEach(function(childSnapshot) {
    var childKey = childSnapshot.key;
    var childData = childSnapshot.val();
    // push the child data into the favorsArray
    favorsArray.push(childData);
  });
  // call a function to update your HTML page with the favorsArray data
  updateHTML(favorsArray);
});

// Define a function to update your HTML page with the favorsArray data
function updateHTML(favorsArray) {
  // use the favorsArray data to populate your HTML page
  // for example, you can loop through the array and create HTML elements for each favor
  // and then append them to a container element on your page
}
