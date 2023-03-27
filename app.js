const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
<<<<<<< HEAD
const bcrypt = require("bcrypt");
const app = express();
const key = "<firebase-api-key>";
=======
const multer = require("multer");
const app = express();
const bcrypt = require("bcrypt");
const { Storage } = require('@google-cloud/storage');
const saltRounds = 10;
>>>>>>> d8aa213df363b135f541c2ef1dd356645878108d

const path = require("path");

const initializePassport = require("./passportConfig");
initializePassport(passport);

const port = process.env.PORT || 3001;

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

<<<<<<< HEAD
// directs user to login page at root
=======
>>>>>>> d8aa213df363b135f541c2ef1dd356645878108d
app.get("/", (req, res) => {
  res.redirect("/login");
});

// directs user to the register.ejs page if /register is added to the root
app.get("/register", (req, res) => {
  res.render("register");
});

// 
app.post("/register", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

<<<<<<< HEAD
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRecord = await admin.auth().createUser({
      email: email,
      password: hashedPassword,
    });

    // Create a reference to the user's data in the database
    const userRef = db.ref("users/" + userRecord.uid);

    // Save the user's data to the database
    userRef.set({
      email: userRecord.email,
      password: hashedPassword,
      uid: userRecord.uid,
      // Add more properties here as needed
    });

    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    res.redirect(`/dashboard?token=${customToken}`);
  } catch (error) {
    res.render("register", { error: error.message });
  }
});

// login start
=======
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

>>>>>>> d8aa213df363b135f541c2ef1dd356645878108d
app.get("/login", (req, res) => {
  let message = req.flash("error")[0];
  res.render("login", { message });
});

<<<<<<< HEAD
app.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const isMatch = await bcrypt.compare(password, userRecord.password);

    if (isMatch) {
      const customToken = await admin.auth().createCustomToken(userRecord.uid);
      res.redirect(`/dashboard?token=${customToken}`);
    } else {
      req.flash("error", "Invalid credentials");
      res.redirect("/login");
    }
  } catch (error) {
    req.flash("error", "Invalid credentials");
    res.redirect("/login");
  }
=======
app.get("/login", (req, res) => {
  let message = req.flash("error")[0];
  res.render("login", { message });
>>>>>>> d8aa213df363b135f541c2ef1dd356645878108d
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

<<<<<<< HEAD

//logout
=======
>>>>>>> d8aa213df363b135f541c2ef1dd356645878108d
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

// 
app.get("/favors", (req, res) => {
res.render("favors");
});