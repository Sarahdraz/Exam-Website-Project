var form = document.getElementById("SigninForm");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  var emailInput = document.getElementById("Email").value.trim();
  var passwordInput = document.getElementById("Password").value;
  var errorMsg = document.getElementById("errorMsg");

  var storedUser = JSON.parse(localStorage.getItem("user"));

  if (!storedUser) {
    errorMsg.textContent = "No registered user found. Please sign up first.";
    return;
  }

  if (emailInput === storedUser.email && passwordInput === storedUser.password) {
    errorMsg.textContent = "";
    alert("Login successful!");
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", storedUser.firstName);
    window.location.href = "ExamPage.html";
  } else {
    errorMsg.textContent = "Incorrect email or password!";
  }
});





