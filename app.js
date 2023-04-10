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
//const functions = require("./functions");

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
  if (registerUser == 1) {
    res.status(500).send("Error hashing password");
  }
  else {

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
  .patch((error) => {
    res.render("register", { error: error.message });
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


app.get('/favors/:userId', async (req, res) => {
  const favors = await getFavorsByDateAndUser(req.params.userId);
  res.render('favors.ejs', { favors });
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

app.get('/create-task', function (req, res) {
  // Handle the request and render the appropriate view
});

app.get("/favor-popup1", (req, res) => {
  res.render("favor-popup1");
});



// temp
function registerUser(email, password, name){
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
          console.error("Error hashing password:", err);
          return 1;
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
          })
          .catch((error) => {
              console.error("Error creating user:", error);
          });
  });
}

function newFavor(userID, scheduled_date, title, details) {
    const newFavorRef = db.ref('/favors').push(); // creates a new unique ID for the new favor
    const newFavorKey = newFavorRef.key; // gets the unique ID of the new favor
  
    const newFavorData = {
      user_requested: userID,
      user_assigned: null,
      scheduled_date: scheduled_date,
      completed_date: null,
      title: title,
      details: details,
      phone: phone,
      address: address
    };
  
    const updates = {};
    updates['/favors/' + newFavorKey] = newFavorData; // sets the new favor data at the new ID
  
    return db.ref().update(updates); // writes the new favor to the database
  }

function acceptFavorRequest(db, favorID, userID){
  db.ref('/favors/' + favorID).set({
    user_assigned: userID
  })
}
  
function completeFavor(db, favorID){
    var today = new Date();
    db.ref('/favors/' + favorID).set({
      completed_date: today
    })
  }
    
  function populateFavorsPage(db, userId){
    return 0;
  }

function getDatabaseSnapshot(db, path_to_data) {
    return new Promise((resolve, reject) => {
        const databaseRef = db.ref(path_to_data);
        databaseRef.once('value')
        .then((snapshot) => {
            const userData = snapshot.val();
            resolve(userData);
        })
        .catch((error) => {
            console.error(error);
            reject(error);
        });
    });
}

  /*
  to call getDatabaseSnapshot
  getDatabaseSnapshot(db, '/path/to/data')
  .then((data) => {
    // Use the retrieved data
  })
  .catch((error) => {
    // Handle the error
  });
  */

async function getFavorsByDateAndUser(userId) {
    const activeFavors = await Favor.find({
      user_requested: userId,
      completed: false
    }).sort({ scheduled_date: 'asc' });
  
    const completedFavors = await Favor.find({
      user_requested: userId,
      completed: true
    }).sort({ completed_date: 'desc' });
  
    return {
      activeFavors,
      completedFavors
    };
  }
