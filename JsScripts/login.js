let userIsLoggedIn;
let adminIsLoggedIn;

function updateLoginStatus() {
  userIsLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  adminIsLoggedIn = sessionStorage.getItem("isAdminLoggedIn") === "true";
}

window.addEventListener("load", updateLoginStatus);
window.addEventListener("pageshow", updateLoginStatus);
window.addEventListener("popstate", updateLoginStatus);

function check(event) {
  event.preventDefault(); // Prevent the default form submission

  var loginUserName = document.getElementById("LoginUserName").value;
  var loginPassword = document.getElementById("LoginPassword").value;

  if (userIsLoggedIn) {
    alert("User: Please log out before logging in with another account.");
    window.location.href = "../pages/profile.html";
    return;
  }

  if (adminIsLoggedIn) {
    alert("Admin: Please log out before logging in with another account.");
    window.location.href = "../pages/admin.html";
    return;
  }

  if (loginUserName === "admin" && loginPassword === "admin1234admin") {
    alert("You are logged in as an admin.");
    sessionStorage.setItem("isAdminLoggedIn", "true");
    location.replace("../pages/admin.html");
    return;
  }

  console.log('Attempting login with username:', loginUserName);

  // POST to server API for user login
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: loginUserName,  // Using username for login
      pw: loginPassword,
    }),
  })
    .then((res) => {
      console.log('Login fetch response status:', res.status);
      return res.json();
    })
    .then((data) => {
      console.log('Login server response:', data);
  if (data.success) {
    alert("You are logged in.");
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("user", JSON.stringify(data.user));

    // Initialize auth system
    if (window.auth) {
      window.auth.isLoggedIn = true;
      window.auth.checkLoginStatus();
    }

    location.replace("../pages/profile.html");
  } else {
    alert(data.error || "Login failed.");
  }
    })
    .catch((err) => {
      console.error('Login fetch error:', err);
      alert("Login failed, please try again.");
    });
}
