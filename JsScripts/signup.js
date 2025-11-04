// Client-side signup now posts to server API. Remove client-side sample users and localStorage usage.

class User {
  constructor(
    userName,
    userFirstName,
    userLastName,
    DateOfBirth,
    email,
    file,
    pw,
    pw2
  ) {
    this.userName = userName;
    this.userFirstName = userFirstName;
    this.userLastName = userLastName;
    this.DateOfBirth = DateOfBirth;
    this.email = email;
    this.file = file;
    this.pw = pw;
    this.pw2 = pw2;
  }

  get getFullName() {
    return this.userFirstName + this.userLastName;
  }
  get getDateOfBirth() {
    return this.DateOfBirth.toString();
  }
}

// (sample users removed - registration now goes to server API)
getCites();

function store(event) {
  event.preventDefault(); // Prevent the default form submission

  const userName = document.getElementById("userName").value;
  const userFirstName = document.getElementById("userFirstName").value;
  const userLastName = document.getElementById("userLastName").value;
  const DateOfBirth = document.getElementById("DateOfBirth").value;
  const email = document.getElementById("email").value;
  const pw = document.getElementById("pw").value;
  const pw2 = document.getElementById("pw2").value;

  console.log('Starting registration with data:', { userName, userFirstName, userLastName, DateOfBirth, email });

  if (!validateUserName(userName)) {
    console.log('Validation failed: userName');
    return false;
  }

  if (!validateUserFirstName(userFirstName)) {
    console.log('Validation failed: userFirstName');
    return false;
  }

  if (!validateUserLastName(userLastName)) {
    console.log('Validation failed: userLastName');
    return false;
  }

  if (!validateBirthDate(DateOfBirth)) {
    console.log('Validation failed: DateOfBirth');
    return false;
  }

  if (!validateEmail(email)) {
    console.log('Validation failed: email');
    return false;
  }

  if (!validatePassword(pw)) {
    console.log('Validation failed: password');
    return false;
  }
  if (pw2.trim() === "") {
    alert("Please repeat the Password");
    return false;
  }

  if (pw !== pw2) {
    alert("Passwords do not match");
    return false;
  }

  console.log('Validation passed, sending fetch to /api/register');

  // POST to server API
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName,
      userFirstName,
      userLastName,
      DateOfBirth,
      email,
      pw,
    }),
  })
    .then((res) => {
      console.log('Fetch response status:', res.status);
      return res.json();
    })
    .then((data) => {
      console.log('Server response:', data);
      if (data.success) {
        alert('You have successfully registered!');
        window.location.href = '../pages/Login.html';
      } else {
        alert('Registration failed: ' + (data.error || 'Unknown error'));
      }
    })
    .catch((err) => {
      console.error('Fetch error:', err);
      alert('Registration failed, please try again.');
    });
}

function getCites() {
  // This function appears to be incomplete or unused
  // Keeping it as is since it's called at the top
}
// createUser is no longer client-side; registration is performed by POSTing to /api/register
/// valdation functions
function validateFileInput(fileInput) {
  if (fileInput.files.length === 0) {
    alert("Please select a file");
    return false;
  }

  const selectedFile = fileInput.files[0];
  const fileName = selectedFile.name;

  if (
    !fileName.toLowerCase().endsWith("jpg") &&
    !fileName.toLowerCase().endsWith("jpeg")
  ) {
    alert("Please select a JPEG or JPG file");
    return false;
  }
  return true;
}
function validateUserName(userName) {
  if (userName.trim() === "") {
    alert("Please enter a User Name");
    return false;
  }
  if (userName.length > 60) {
    console.log("Username should not exceed 60 characters.");
    return false;
  }

  const usernameRegex = /^[A-Za-z0-9\s\-_]*[A-Za-z][A-Za-z0-9\s\-_]*$/;
  if (!usernameRegex.test(userName)) {
    console.log(
      "Username should contain only alphanumeric characters, spaces, dashes, and underscores, and should include at least one letter."
    );
    return false;
  }
  // Username uniqueness is checked on the server during registration

  return true;
}

function validatePassword(pw) {
  if (pw.trim() === "") {
    alert("Please enter Password");
    return false;
  }
  if (!/\d/.test(pw)) {
    alert("Your password needs a number");
    return false;
  }

  if (!/[A-Z]/.test(pw)) {
    alert("Your password needs an uppercase letter");
    return false;
  }

  if (!/[a-z]/.test(pw)) {
    alert("Your password needs a lowercase letter");
    return false;
  }
  if (!/[^a-zA-Z0-9]/.test(pw)) {
    alert("Your password needs a special character");
    return false;
  }
  if (pw.length < 7 || pw.length > 12) {
    alert("The password length must be between 7-12");
    return false;
  }
  return true;
}
function validateEmail(email) {
  if (email.trim() === "") {
    alert("Please enter Email Address");
    return false;
  }
  if (email.indexOf("@") === -1) {
    return false; // אין תו @ באימייל
  }

  if (email.indexOf(".") === -1) {
    return false; // אין נקודה באימייל
  }

  const domain = email.split("@")[1];
  if (domain.indexOf(".") === -1) {
    return false; // הדומיין אינו תקף (אין נקודה)
  }
  return true;
}

function validateBirthDate(DateOfBirth) {
  if (DateOfBirth.trim() === "") {
    alert("Please enter Birth Date");
    return false;
  }
  return true;
}

// Address-related validation functions removed as they are no longer needed
function validateUserFirstName(userFirstName) {
  if (userFirstName.trim() === "") {
    alert("Please enter First Name");
    return false;
  }
  if (containsNumber(userFirstName)) {
    alert("User first name  must not contain numbers");
    return false;
  }
  return true;
}
function containsNumber(str) {
  return /\d/.test(str);
}
function validateUserLastName(userLastName) {
  if (userLastName.trim() === "") {
    alert("Please enter Last Name");
    return false;
  }
  if (containsNumber(userLastName)) {
    alert("User last name must not contain numbers");
    return false;
  }

  return true;
}

// //  form date getter
// var today = new Date();
// var dd = today.getDate();
// var mm = today.getMonth() + 1; //January is 0!
// var yyyy = today.getFullYear();
// if (dd < 10) {
//   dd = "0" + dd;
// }
// if (mm < 10) {
//   mm = "0" + mm;
// }
// today = yyyy + "-" + mm + "-" + dd;
// document.getElementById("DateOfBirth").setAttribute("max", today);

// No longer using localStorage for users - all data is stored in SQLAlchemy database

// Removed unused functions: validateFileInput, isUserNameExists, emailAvilabityCheek
