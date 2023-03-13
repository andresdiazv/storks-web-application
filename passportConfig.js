const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

function initializePassport() {
  passport.use(new LocalStrategy(
    function(username, password, done) {
        // Your authentication logic here
        
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    // Your deserialization logic here
  });
}

module.exports = initializePassport;
