const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const app = express();

const path = require("path");

const initializePassport = require("./passportConfig");
initializePassport(passport);

const port = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storks-4753a-default-rtdb.firebaseio.com",
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
        password: password,
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
// login start
app.get("/login", (req, res) => {
  let message = req.flash("error")[0]; // retrieve the first error message from the flash array
  res.render("login", { message }); // pass in the error message as a variable to the login template
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  admin
    .auth()
    .getUserByEmail(email)
    .then((userRecord) => {
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
});

// login end

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

//logout
app.get("/logout", (req, res) => {
  res.redirect("/login");
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
