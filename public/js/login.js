// Get the form element
const form = document.querySelector("form");

// Add an event listener to the form submit event
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  // Call Firebase auth to sign in with email and password
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const idToken = userCredential.user.getIdToken();
      window.location.href = `/dashboard?idToken=${idToken}`;
    })
    .catch((error) => {
      const errorMessage = error.message;
      document.querySelector(".error-message").textContent = errorMessage;
    });
});
