module.exports = {
  isValidEmail(email) {
    const emailRegEx = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/igm;

    return emailRegEx.test(email);
  },

  isValidPassword(password) {
    return password.length >= 6 && password.length <= 30;
  },

  passwordsMatch(pass1, pass2) {
    return pass1 === pass2;
  },

  signUpFieldsNotBlank(field) {
    return field.length > 0;
  }
}