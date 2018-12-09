const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const sendMail = require('./sendgrid');

// Init models
const User = require('../../db/models').User;
const Verification = require('../../db/models').Verification;

// Import validation file
const validation = require('../../validation/validation');

// @route   GET /users/sign-up
// @desc    Testing view config
// @access  Public
router.get('/sign-up', (req, res) => {
  res.render('users/signUp', { title: 'Sign Up', user: req.user } );
})

// @route   POST /users/sign-up
// @desc    create a new user and log them in
// @access  Public
router.post('/sign-up', async (req, res) => {
  if(!validation.isValidEmail(req.body.email)) {
    req.flash('error', 'Invalid email.');
    return res.redirect('/users/sign-up');
  }

  if(!validation.isValidPassword(req.body.password)) {
    req.flash('error', 'Invalid password.');
    return res.redirect('/users/sign-up');
  }

  if(!validation.passwordsMatch(req.body.password, req.body.confirmPassword)) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/users/sign-up');
  }

  if(!validation.signUpFieldsNotBlank(req.body.email) || !validation.signUpFieldsNotBlank(req.body.password)) {
    req.flash('error', 'All fields are required');
    return res.redirect('/users/sign-up');
  }

  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role
  };

  try{
    const userExists = await User.findOne({ where: { email: newUser.email } });

    if(userExists) {
      req.flash('error', 'A user has already been created for that email.');
      res.redirect('/users/sign-up');
    } else {
      const password = await hashPassword(newUser.password)
      const user = await User.create({
        email: newUser.email,
        password: password,
        role: req.body.role
      });

      await sendMail(user);
      req.flash('notice', `Verification email sent to ${user.email}.`);
      res.redirect('/users/sign-in');
      /////////<<<<<<<<<--------------- Here is where verification email should go.
    
    }
  } catch(errors) {
    console.log(errors);
    res.redirect('/users/sign-up');
  }  
});

// @route   GET /users/sign-in
// @desc    Render user sign-in page
// @access  Public
router.get('/sign-in', (req, res) => {
  if(req.user) {
    req.logout();
    req.flash('notice', 'You\'ve successfully signed out!');
    return res.redirect('/users/sign-in');
  }

  res.render('users/signIn', { title: 'Sign In', user: req.user})
});

// @route   POST /users/sign-in
// @desc    Sign in a user
// @access  Public
router.post('/sign-in', async (req, res) => {
  const user = await User.findOne({ where: { email: req.body.email } });

  if(!user) {
    req.flash('error', 'An account for this email does not exist.');
     return res.redirect('/users/sign-in');
  }

  if(!user.active) {
    req.flash('error', 'You must activate your account before you are able to sign in.');
    return res.redirect('/users/sign-in');
  }

  const passwordDoesMatch = await bcrypt.compare(req.body.password, user.password);

  if(passwordDoesMatch) {
    passport.authenticate('local')(req, res, () => {
      if(!req.user) {
        req.flash('notice', 'Sign in failed, please try again.');
        res.redirect('/users/sign-in');
      } else {
        req.flash('notice', 'You\'ve successfully signed in!');
        res.redirect('/users/sign-up');                 /////////////<-------- change this
      }
    });
  } else {
    req.flash('error', 'Email and/or password do not match our records.');
    res.redirect('/users/sign-in');
  }  
});

// @route   GET /users/verify
// @desc    Render verification page
// @access  Public
router.get('/verify', async (req, res) => {
  res.render('users/verify', { title: 'Verify Email', user: req.user });
});

// @route   POST /users/verify
// @desc    Update user account to active
// @access  Public
router.post('/verify', async (req, res) => {
  const verificationString = req.body.validation;
  const verification = await Verification.findOne({ where: { hash: verificationString } });

  if(!verification) {
    req.flash('error', 'Invalid verification code entered.');
    res.redirect('/users/verify');
  }

  const user = await User.findOne({ where: { id: verification.user_id } });

  await user.update({ active: true });
  await verification.destroy();

  req.flash('notice', 'Your account was activated successfully! You may now sign in to your account.');
  res.redirect('/users/sign-in');
});

async function hashPassword(password) {
  const salt = await bcrypt.genSalt();
  return await bcrypt.hash(password, salt);
}

module.exports = router;