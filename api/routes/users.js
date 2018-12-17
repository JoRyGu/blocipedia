const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const sendMail = require('./sendgrid');
const userQuery = require('../../db/queries/users');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

// Init models
const User = require('../../db/models').User;
const Verification = require('../../db/models').Verification;
const Wiki = require('../../db/models').Wiki;

// Import validation file
const userValidation = require('../../validation/user');

// Import auth file
const auth = require('../../auth/helpers').ensureAuthenticated;

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
  const errors = userValidation(req.body.firstname, req.body.lastname, req.body.email, req.body.password, req.body.confirmPassword);
  const errorsArray = Object.keys(errors).map(key => {
    return errors[key];
  })

  if(!errors && !errors.length) {
    req.flash('error', errorsArray);
    return res.redirect('/users/sign-up');
  }

  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    role: req.body.role
  };

  const checkUser = await User.findOne({ where: { email: newUser.email } });

  if(checkUser) {
    req.flash('error', 'User already exists for that email.');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newUser.password, salt);

  const user = await User.create({
    email: newUser.email,
    password: hash,
    firstname: newUser.firstname,
    lastname: newUser.lastname
  });

  passport.authenticate('local')(req, res, () => {
    if(!req.user) {
      req.flash('error', 'There was an error signing you in.');
      return res.redirect('/users/sign-in');
    } else {
      req.flash('notice', 'You were successfully signed in.');
      if(req.body.role === 'premium') {
        return res.redirect('/users/premium');
      }
    
      sendMail(user)
      .then(() => {
        req.flash('notice', 'Verification email sent to ' + user.email);
        res.redirect('/users/verify');
      })
    }
  })
    
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

  const passwordDoesMatch = await bcrypt.compare(req.body.password, user.password);

  if(passwordDoesMatch) {
    passport.authenticate('local')(req, res, () => {
      if(!req.user) {
        req.flash('notice', 'Sign in failed, please try again.');
        res.redirect('/users/sign-in');
      } else {
        req.flash('notice', 'You\'ve successfully signed in!');
        res.redirect(`/users/${req.user.id}/profile`);
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

  if(!user) {
    return req.flash('error', '404: Bad Request');
  }

  await user.update({ active: true });
  await verification.destroy();

  req.flash('notice', 'Your account was activated successfully! You may now sign in to your account.');
  res.redirect('/users/sign-in');
});

// @route   GET /users/:id/profile
// @desc    Render user's profile page
// @access  Private
router.get('/:id/profile', auth, async (req, res) => {
  if(req.user.id !== parseInt(req.params.id)) {
    req.flash('error', 'You are not authorized to view that profile.');
    return res.redirect('/');
  }
  const wikis = await Wiki.findAll({ where: { userId: req.user.id } });

  res.render('users/profile', { title: 'Profile', user: req.user, wikis: wikis });
});

// @route   GET /users/premium
// @desc    Render premium payment page
// @access  Private
router.get('/premium', auth, async (req, res) => {
  res.render('users/premium', { title: 'Upgrade Account', user: req.user });
});

// @route   POST /users/premium
// @desc    Send information to the server setting premium status for user
// @access  Private
router.post('/premium', auth, async (req, res) => {
  const token = req.body.stripeToken;

  stripe.charges.create({
    amount: 1000,
    currency: 'usd',
    description: 'Premium Membership',
    source: token
  })
  .then(charge => {
    if(charge) {
      User.findByPk(req.user.id)
      .then(user => {
        if(user) {
          user.update({
            role: 'premium'
          })
          .then(user => {
            sendMail(user)
            .then(() => {
              req.flash('notice', 'Congratulations! You\'ve been upgraded to a premium account. Check your email for a verification code!');
              res.redirect(`/users/${req.user.id}/profile`);
            })
          });
        } else {
          req.flash('error', 'There was an error finding your account.');
          return res.redirect('/users/premium');
        }
      });
    } else {
      req.flash('error', 'There was an error processing your payment.');
      return res.redirect('/users/premium');
    }
  })
  .catch(err => {
    req.flash('error', err);
    console.log(err);
    return res.redirect('/users/premium');
  });
});

// @route   GET /users/downgrade
// @desc    Render user downgrade page
// @access  Private
router.get('/downgrade', auth, async (req, res) => {
  res.render('users/downgrade', { title: 'Downgrade Account', user: req.user });
});

// @route   POST /users/downgrade
// @desc    Update user to member status
// @access  Private
router.post('/downgrade', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if(!user) {
    req.flash('error', 'There was an error when downgrading your account. Please email support.');
    return res.redirect('/users/sign-in');
  }

  await user.update({
    role: 'member'
  });

  const privateWikis = await Wiki.findAll({
    where: {
      userId: user.id,
      private: true
    }
  });

  for(let i = 0; i < privateWikis.length; i++) {
    await privateWikis[i].update({
      private: false
    });
  }

  req.flash('notice', 'You have successfully downgraded your account.');
  res.redirect(`/users/${req.user.id}/profile`);
});

module.exports = router;