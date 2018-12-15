require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../db/models').User;
const authorize = require('../auth/helpers');
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
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');
app.use('/views', express.static('views'));

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
  User.findByPk(id)
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
const wikis = require('../api/routes/wikis');

// Init routes
app.use('/users', users);
app.use('/', static);
app.use('/wikis', wikis);

// Set port
const port = process.env.PORT || 5000;

// App listen
app.listen(port, () => console.log(`Server listening on port ${port}.`));