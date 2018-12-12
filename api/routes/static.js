const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('static/landingPage', { title: 'Welcome to Bloccit!', user: req.user });
});

module.exports = router;