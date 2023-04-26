const LocalStrategy = require("passport-local").Strategy;
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

function initialize(passport) {
  const authenticateUser = (email, password, done) => {
    admin
      .auth()
      .getUserByEmail(email)
      .then((userRecord) => {
       
        admin
          .database()
          .ref(`users/${userRecord.uid}`)
          .once("value")
          .then((snapshot) => {
            const userData = snapshot.val();

            bcrypt.compare(password, userData.password, (err, isMatch) => {
              if (err) {
                return done(err);
              }

              if (isMatch) {
                return done(null, userData);
              } else {
                return done(null, false, { message: "Incorrect password" });
              }
            });
          })
          .catch((error) => {
            return done(null, false, { message: "Error retrieving user data" });
          });
      })
      .catch((error) => {
        return done(null, false, { message: "No user with that email" });
      });
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));

  passport.serializeUser((user, done) => {
    done(null, user.uid);
  });

  passport.deserializeUser((id, done) => {
    admin
      .database()
      .ref(`users/${id}`)
      .once("value")
      .then((snapshot) => {
        const userData = snapshot.val();
        return done(null, userData);
      })
      .catch((error) => {
        return done(error);
      });
  });
}

module.exports = initialize;
