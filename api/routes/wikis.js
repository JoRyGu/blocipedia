const express = require('express');
const router = express.Router();
const authentication = require('../../auth/helpers').ensureAuthenticated;
const Wiki = require('../../db/models').Wiki;
const User = require('../../db/models').User;

// @route   GET /wikis
// @desc    Render list of public wikis
// @access  Public
router.get('/', async (req, res) => {
  const publicWikis = await Wiki.findAll({
    where: {
      private: false
    }
  });

  let privateWikis;

  if(req.user) {
    privateWikis = await Wiki.findAll({
      where: {
        userId: req.user.id,
        private: true
      }
    });
  }

  const wikis = [];

  if(publicWikis) {
    for(let i = 0; i < publicWikis.length; i++) {
      wikis.push(publicWikis[i]);
    }
  }
  
  if(privateWikis) {
    for(let i = 0; i < privateWikis.length; i++) {
      wikis.push(privateWikis[i]);
    }
  }
  
  res.render('wikis/view', { title: 'Public Wikis', user: req.user, wikis });
})

// @route   GET /wikis/create
// @desc    Get wiki creation page
// @access  Private
router.get('/create', authentication, async (req, res) => {
  if(!req.user.active) {
    req.flash('error', 'You must verify your account before you can create wikis.');
    return res.redirect('/users/verify');
  }
  res.render('wikis/create', { title: 'Create New Wiki', user: req.user });
});

// @route   POST /wikis/create
// @desc    Post new wiki to server
// @access  Private
router.post('/create', authentication, async (req, res) => {
  if(!req.user.active) {
    req.flash('error', 'You must verify your account before creating wikis.');
    return res.redirect('/users/verify');
  }

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
    private: req.body.private === 'private' && req.user.role === 'premium' ? true : false,
    userId: req.user.id
  };

  const wiki = await Wiki.create(newWiki);

  res.redirect(`/users/${req.user.id}/profile`);
});

// @route   GET /wikis/:wikiId
// @desc    Get wiki page
// @access  Public/Private
router.get('/:wikiId', async (req, res) => {
  const wiki = await Wiki.findByPk(req.params.wikiId);
  const updater = await User.findByPk(wiki.updaterId);

  if(wiki.private) {
    if((!req.user) || (req.user.id !== wiki.userId)) {
      req.flash('error', 'This is a private wiki page.');
      return res.redirect('/wikis');
    }
  }

  res.render('wikis/page', { title: `${wiki.title}`, user: req.user, wiki, updater });
});

// @route   GET /wikis/:wikiId/update
// @desc    Get wiki editor page
// @access  Private
router.get('/:wikiId/update', authentication, async (req, res) => {
  const wiki = await Wiki.findByPk(req.params.wikiId);
  res.render('wikis/update', { wiki, title: 'Update Wiki', user: req.user });
});

// @route   POST /wikis/:wikiId/update
// @desc    Update a wiki
// @access  Private
router.post('/:wikiId/update', authentication, async (req, res) => {
  const wiki = await Wiki.findByPk(req.params.wikiId);

  if(req.body.privateUpdate) {
    await wiki.update({
      private: req.body.privateUpdate
    });
    return res.redirect(`/users/${req.user.id}/profile`)
  } else {
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
  
    if(!wiki) {
      req.flash('error', 'No wiki found under that ID.');
      return res.redirect(`/users/${req.params.id}/profile`);
    }
  
    await wiki.update({
      title: req.body.title,
      body: req.body.body,
      updated: true,
      updaterId: req.user.id,
      private: req.body.private === 'private' && req.user.role === 'premium' && wiki.userId === req.user.id ? true : false
    });
  
    const user = await User.findByPk(req.user.id);
  
    res.redirect(`/wikis/${req.params.wikiId}`);
  }
});

// @route   post /wikis/:wikiId/delete
// @desc    Delete wiki
// @access  Private
router.post('/:wikiId/delete', authentication, async (req, res) => {
  const wiki = await Wiki.findByPk(req.params.wikiId);

  if(!wiki) {
    req.flash('error', 'No wiki found with that ID.');
    return res.redirect('/wikis');
  }

  await wiki.destroy();

  res.redirect(`/users/${req.user.id}/profile`);
});


module.exports = router;

