const User = require("../models").User;
const bcrypt = require("bcryptjs");

async function create(newUser, callback) {
  // Validate that newUser is not an existing user.
  try {
    const user = await User.findOne({
      where: {
        email: newUser.email
      }
    });

    if (user) {
      return callback("User already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(newUser.password, salt);

    const createdUser = await User.create({
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      password: encryptedPassword,
      role: newUser
    });

    return callback(null, createdUser);
  } catch (error) {
    return callback(error);
  }
}

module.exports = {
  create
};
