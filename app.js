const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const bcrypt = require("bcrypt");
const app = express();
const key = "<firebase-api-key>";

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

// directs user to login page at root
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
app.get("/login", (req, res) => {
  let message = req.flash("error")[0]; // retrieve the first error message from the flash array
  res.render("login", { message }); // pass in the error message as a variable to the login template
});

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
});

// login end

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
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
      const data = snapshot.val();
    })
    return data;
}

function populateFavorsPage(db, userId){
  return 0;
}

//logout
app.get("/logout", (req, res) => {
res.redirect("/login");
});

app.listen(port, () => {
console.log(`Server listening on port ${port}`);
});

