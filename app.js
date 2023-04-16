const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const multer = require("multer");
const app = express();
const bcrypt = require("bcrypt");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
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
        res.render("dashboard", { user: userData, db: db });
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

app.post("/upload", checkAuthenticated, upload.single("image"), (req, res) => {
  const userId = req.user.uid;
  const file = req.file;
  const bucket = admin.storage().bucket();
  const filename = `profile.jpg`;
  const fileUpload = bucket.file(`${userId}/${filename}`);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
  });

  stream.on("error", (error) => {
    console.error("Error uploading file:", error);
    res.status(500).send("Error uploading file");
  });

  stream.on("finish", () => {
    fileUpload.makePublic().then(() => {
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${userId}/${filename}`;
      const userRef = db.ref(`users/${userId}`);
      userRef.update({
        profilePicture: imageUrl,
      });
      res.redirect("/profile-page");
    });
  });

  stream.end(file.buffer);
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

app.post("/create-task", checkAuthenticated, (req, res) => {
  const userId = req.user.uid;
  const name = req.body.markerTitle;
  const phoneNumber = req.body.markerPhone;
  const address = req.body.markerAddress;
  const description = req.body.markerDescription;

  // Create a new favor node in the database
  const favorsRef = db.ref("favors");
  const newFavorRef = favorsRef.push();
  newFavorRef
    .set({
      name: name,
      phoneNumber: phoneNumber,
      address: address,
      description: description,
    })
    .then(() => {
      const markerRef = db.ref(`markers/${userId}/${newFavorRef.key}`);
      markerRef.set({
        name: name,
        phoneNumber: phoneNumber,
        address: address,
        description: description,
      });
      res.redirect("/dashboard");
    })
    .catch((error) => {
      console.error("Error creating task:", error);
      res.status(500).send("Error creating task");
    });
});

app.post("/marker", checkAuthenticated, (req, res) => {
  const userId = req.user.uid;
  const markerTitle = req.body["marker-name"];
  const markerPhone = req.body["marker-phone"];
  const markerAddress = req.body["marker-address"];
  const markerDescription = req.body["marker-description"];
  const location = JSON.parse(req.body.location);

  // Create a new favor node in the database
  const favorsRef = db.ref("favors");
  const newFavorRef = favorsRef.push();

  newFavorRef
    .set({
      user_requested: userId,
      name: markerTitle,
      phoneNumber: markerPhone,
      address: markerAddress,
      description: markerDescription,
      latitude: location.lat,
      longitude: location.lng,
    })
    .then(() => {
      const markerRef = db.ref(`favors/${newFavorRef.key}`);
      markerRef.set({
        user_requested: userId,
        user_assigned: 0,
        date_requested: new Date().toJSON(),
        date_completed: 0,
        name: markerTitle,
        phoneNumber: markerPhone,
        address: markerAddress,
        description: markerDescription,
        latitude: location.lat,
        longitude: location.lng,
      });
      res.redirect("/dashboard");
    })
    .catch((error) => {
      console.error("Error creating task:", error);
      res.status(500).send("Error creating task");
    });
});

app.get("/favor-popup1", (req, res) => {
  res.render("favor-popup1");
});

app.get("/rewards-page", (req, res) => {
  res.render("rewards-page");
});
