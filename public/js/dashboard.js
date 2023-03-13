// Retrieve the ID token from the query parameter
const params = new URLSearchParams(window.location.search);
const idToken = params.get("idToken");

// Call Firebase authentication API to verify the ID token
firebase
  .auth()
  .signInWithCustomToken(idToken)
  .then(() => {
    // Retrieve data from Firebase Realtime Database
    return firebase.database().ref("data").once("value");
  })
  .then((snapshot) => {
    const data = snapshot.val();

    // Display the data on the dashboard
    const dashboardElement = document.querySelector("#dashboard");
    const dataElement = document.createElement("div");
    dataElement.textContent = JSON.stringify(data);
    dashboardElement.appendChild(dataElement);
  })
  .catch((error) => {
    console.error(error);
  });
