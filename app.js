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
  let message = req.flash("error")[0]; // retrieve the first error message from the flash array
  res.render("login", { message }); // pass in the error message as a variable to the login template
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Fetch the user data from the database based on the user's email
  const userRef = db.ref("users");
  userRef.orderByChild("email").equalTo(email).once("value", (snapshot) => {
    const userData = snapshot.val();

    if (userData) {
      // User exists with the provided email
      const userId = Object.keys(userData)[0]; // Get the user ID

      // Compare the user's input password with the password in the database
      admin
        .auth()
        .getUser(userId)
        .then((userRecord) => {
          const dbPassword = userData[userId].password;

          if (password === dbPassword) {
            // Passwords match, generate a custom token and redirect to dashboard
            admin
              .auth()
              .createCustomToken(userRecord.uid)
              .then((customToken) => {
                res.redirect(`/dashboard?idToken=${customToken}`);
              })
              .catch((error) => {
                req.flash("error", error.message); // store the error message in the flash array
                res.redirect("/login"); // redirect to the login page
              });
          } else {
            // Passwords don't match, show an error message
            req.flash("error", "Invalid password"); // store the error message in the flash array
            res.redirect("/login"); // redirect to the login page
          }
        })
        .catch((error) => {
          req.flash("error", error.message); // store the error message in the flash array
          res.redirect("/login"); // redirect to the login page
        });
    } else {
      // User doesn't exist with the provided email
      req.flash("error", "User doesn't exist"); // store the error message in the flash array
      res.redirect("/login"); // redirect to the login page
    }
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
        res.render("dashboard", { user });
      });
    })
    .catch((error) => {
      console.error("Error verifying ID token:", error);
      res.redirect("/login");
    });
});

app.get("/data", verifyIdToken, (req, res) => {
  const dataRef = db.ref("data");
  dataRef.once("value", (snapshot) => {
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
