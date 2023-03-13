const loginForm = document.querySelector('#login-form');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  // Call Firebase authentication API to sign in the user with email and password
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Retrieve the user's ID token
      return userCredential.user.getIdToken();
    })
    .then((idToken) => {
      // Redirect the user to the dashboard with the ID token as a query parameter
      window.location.href = `/dashboard?idToken=${idToken}`;
    })
    .catch((error) => {
      console.error(error);
      const errorMessage = document.querySelector('#error-message');
      errorMessage.textContent = error.message;
    });
});
