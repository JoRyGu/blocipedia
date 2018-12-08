require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../db/models').User;
const authorize = require('../authorization/helpers');
const session = require('express-session');
const flash = require('express-flash');
const expressValidator = require('express-validator');

// Init app
const app = express();
app.use(expressValidator());
app.use(session({
  secret: process.env.cookieSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1.21e+9 }
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
})

// Init body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Init views path and engine
console.log(path.join(__dirname, '..', 'views'));
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Init passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
  usernameField: 'email'
}, (email, password, done) => {
  User.findOne({ where: { email } })
  .then(user => {
    if(!user || !authorize.comparePasswords(password, user.password)) {
      return done(null, false, { message: 'Invalid email or password.' });
    }
    return done(null, user);
  });
}));
passport.serializeUser((user, callback) => {
  callback(null, user.id);
});
passport.deserializeUser((id, callback) => {
  User.findById(id)
  .then(user => {
    callback(null, user);
  })
  .catch(err => {
    callback(err, user);
  })
})

//

// Import routes
const users = require('../api/routes/users');
const static = require('../api/routes/static');

// Init routes
app.use('/users', users);
// app.use('/', static);

// Set port
const port = process.env.PORT || 5000;

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
  to: 'test@example.com',
  from: 'test@example.com',
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
};
sgMail.send(msg);

// App listen
app.listen(port, () => console.log(`Server listening on port ${port}.`));