// Shared validation helpers used by admin and profile pages
function cheekHebrewValidation(str) {
  return /[\u0590-\u05FF]/.test(str);
}

function validateStreetAddress(StreetAddress) {
  if (StreetAddress.trim() === "") {
    alert("Please enter Street Address");
    return false;
  }
  if (!cheekHebrewValidation(StreetAddress)) {
    alert("The street address must be in Hebrew");
    return false;
  }

  return true;
}
