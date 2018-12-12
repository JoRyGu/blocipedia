const express = require('express');
const router = express.Router();
const authentication = require('../../auth/helpers').ensureAuthenticated;
const Wiki = require('../../db/models').Wiki;
const User = require('../../db/models').User;

// @route   GET /wikis
// @desc    Render list of public wikis
// @access  Public
router.get('/', async (req, res) => {
  res.render('wikis/view', { title: 'Public Wikis', user: req.user });
})

// @route   GET /wikis/create
// @desc    Get wiki creation page
// @access  Private
router.get('/create', authentication, async (req, res) => {
  res.render('wikis/create', { title: 'Create New Wiki', user: req.user });
});

// @route   POST /wikis/create
// @desc    Post new wiki to server
// @access  Private
router.post('/create', authentication, async (req, res) => {
  /* -------------------- THIS ROUTE IS UNDER DEVELOPMENT -------------------------*/
  /* --- NEEDS --- */
  // [x] authentication - only users are able to create and edit wikis
  // [] code to handle both private and public wikis
  // [x] change vanilla textarea to a markdown editor
  // [x] implement a side by side editor/preview window

  if(!req.body.title) {
    console.log(req.body.title);
    req.flash('error', 'You must enter a title for this Wiki.');
    return res.redirect('/wikis/create');
  }

  if(!req.body.body) {
    req.flash('error', 'You cannot submit an empty Wiki.');
    return res.redirect('/wikis/create');
  }

  if(req.body.title.length < 3 || req.body.title.length > 30) {
    req.flash('error', 'Your title must be between 3 and 30 characters.');
    return res.redirect('/wikis/create');
  }

  const newWiki = {
    title: req.body.title,
    body: req.body.body,
    private: false, // <<<-------------- adjust this when implementing private wikis
    userId: req.user.id
  };

  const wiki = await Wiki.create(newWiki);

  res.redirect(`/users/${req.user.id}/profile`);
});

// @route   GET /wikis/:wikiId
// @desc    Get wiki page
// @access  Public/Private
router.get('/:wikiId', async (req, res) => {
  const wiki = await Wiki.findById(req.params.wikiId);
  const updater = await User.findById(wiki.updaterId);

  if(wiki.private) {
    // Build in logic here
  }

  res.render('wikis/page', { title: `${wiki.title}`, user: req.user, wiki, updater });
});

// @route   GET /wikis/:wikiId/update
// @desc    Get wiki editor page
// @access  Private
router.get('/:wikiId/update', authentication, async (req, res) => {
  const wiki = await Wiki.findById(req.params.wikiId);
  res.render('wikis/update', { wiki, title: 'Update Wiki', user: req.user });
});

// @route   POST /wikis/:wikiId/update
// @desc    Update a wiki
// @access  Private
router.post('/:wikiId/update', authentication, async (req, res) => {
  if(!req.body.title) {
    req.flash('error', 'You must enter a title for this Wiki.');
    return res.redirect('/wikis/create');
  }

  if(!req.body.body) {
    req.flash('error', 'You cannot submit an empty Wiki.');
    return res.redirect('/wikis/create');
  }

  if(req.body.title.length < 3 || req.body.title.length > 30) {
    req.flash('error', 'Your title must be between 3 and 30 characters.');
    return res.redirect('/wikis/create');
  }

  const wiki = await Wiki.findById(req.params.wikiId);

  if(!wiki) {
    req.flash('error', 'No wiki found under that ID.');
    return res.redirect(`/users/${req.params.id}/profile`);
  }

  await wiki.update({
    title: req.body.title,
    body: req.body.body,
    updated: true,
    updaterId: req.user.id
  });

  const user = await User.findById(req.user.id);

  res.redirect(`/wikis/${req.params.wikiId}`);
});

// @route   post /wikis/:wikiId/delete
// @desc    Delete wiki
// @access  Private
router.post('/:wikiId/delete', authentication, async (req, res) => {
  const wiki = await Wiki.findById(req.params.wikiId);

  if(!wiki) {
    req.flash('error', 'No wiki found with that ID.');
    return res.redirect('/wikis');
  }

  await wiki.destroy();

  res.redirect(`/users/${req.user.id}/profile`);
});


module.exports = router;

