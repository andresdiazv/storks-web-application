const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./private-key.json");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const app = express();

const path = require("path");

app.use(
  session({
    secret: "secret",

    resave: false,

    saveUninitialized: false,
  })
);

const initializePassport = require("./passportConfig");
initializePassport(passport);

const port = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://storks-4753a-default-rtdb.firebaseio.com",
});

const db = admin.database();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
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
  res.render("register", {
    error: req.flash("error"),
    success: req.flash("success"),
    message: req.flash("message"), // add this line
  });
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    req.flash("error", "Please provide both email and password.");
    res.redirect("/register");
    return;
  }

  admin
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Create a reference to the user's data in the database
      const userRef = db.ref("users");

      // Save the user's data to the database
      const newUserRef = userRef.push();
      newUserRef.set({
        email: user.email,
        uid: user.uid,
        // Add more properties here as needed
      });

      req.flash("success", "Registration successful. Please log in.");
      res.redirect("/login");
    })
    .catch((error) => {
      req.flash("error", error.message);
      res.redirect("/register");
    });
});

app.get("/login", (req, res) => {
  res.render("login", {
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    req.flash("error", "Please provide both email and password.");
    res.redirect("/login");
    return;
  }

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
          req.flash("error", error.message);
          res.redirect("/login");
        });
    })
    .catch((error) => {
      req.flash("error", error.message);
      res.redirect("/login");
    });
});

app.get("/dashboard", verifyIdToken, (req, res) => {
  const uid = req.uid; // Retrieve the user's UID from the ID token
  const userRef = db.ref(`users/${uid}`);

  userRef
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val();

      // Retrieve the dashboard data for the authenticated user from the Firebase Realtime Database
      const dashboardRef = db.ref(`dashboard/${uid}`);
      dashboardRef.once("value").then((snapshot) => {
        const dashboardData = snapshot.val();
        res.render("dashboard", { userData, dashboardData });
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

app.post("/dashboard", (req, res) => {
  const uid = req.user.uid; // Assumes the user is already authenticated
  const data = req.body.data; // Assumes that the data to be updated is sent in the request body

  // Update the dashboard data for the authenticated user in the Firebase Realtime Database
  admin
    .database()
    .ref(`dashboard/${uid}`)
    .update(data)
    .then(() => {
      // Redirect back to the dashboard page
      res.redirect("/dashboard");
    })
    .catch((error) => {
      // Handle error
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

app.get("/data", (req, res) => {
  // Read data from the Firebase Realtime Database
  admin
    .database()
    .ref("data")
    .once("value")
    .then((snapshot) => {
      const data = snapshot.val();
      res.json(data);
    })
    .catch((error) => {
      // Handle error
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
