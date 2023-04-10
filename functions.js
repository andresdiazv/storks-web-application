// populate favors page
  
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


function newFavor(db, userID, scheduled_date, title, details) {
    const newFavorRef = db.ref('/favors').push(); // creates a new unique ID for the new favor
    const newFavorKey = newFavorRef.key; // gets the unique ID of the new favor
  
    const newFavorData = {
      user_requested: userID,
      user_assigned: null,
      scheduled_date: scheduled_date,
      completed_date: null,
      title: title,
      details: details
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

  // for the app.js page for calling above function
  /*
  app.get('/favors', async (req, res) => {
    const userId = req.user._id;
    const { activeFavors, completedFavors } = await getFavorsByDateAndUser(userId);
    res.render('favors', { activeFavors, completedFavors });
  });

*/


module.exports = {
  registerUser,
  newFavor,
  acceptFavorRequest,
  completeFavor,
  populateFavorsPage,
  getDatabaseSnapshot,
  getFavorsByDateAndUser
};