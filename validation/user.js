function isValidEmail(email) {
  const emailRegex =  /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/igm;
  return emailRegex.test(email);
}

function isValidPassword(password) {
  return password.length >= 6 && password.length <= 30;
}

function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

function signUpFieldNotBlank(field) {
  return field.length > 0;
}

function nameFieldsNotEmpty(firstname, lastname) {
  return firstname.length > 0 && lastname.length > 0;
}

function signUpSuite(firstname, lastname, email, password, confirmPassword) {
  const errors = {};

  if(!nameFieldsNotEmpty(firstname, lastname)) {
    errors.nameRequired = 'First and last name are required.';
  }

  if(!signUpFieldNotBlank(email) || !signUpFieldNotBlank(password)) {
    errors.emailRequired = 'Email and password are required.';
  }

  if(!isValidEmail(email)) {
    errors.email = 'Invalid email address.';
  }

  if(!isValidPassword(password)) {
    errors.password = 'Password must be between 6 and 30 characters.';
  }

  if(!passwordsMatch(password, confirmPassword)) {
    errors.password = 'Passwords do not match.';
  }

  return errors;
}

module.exports = signUpSuite;