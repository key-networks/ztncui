/*
  ztncui - ZeroTier network controller UI
  Copyright (C) 2017  Key Networks (https://key-networks.com)
  Licensed under GPLv3 - see LICENSE for details.
*/

const express = require('express');
const auth = require('../controllers/auth');
const authenticate = auth.authenticate;
const restrict = auth.restrict;
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('front_door', {title: 'ztncui'});
});

router.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});

router.get('/login', function(req, res) {
  let message = null;
  if (req.session.error) {
    if (req.session.error !== 'Access denied!') {
      message = req.session.error;
    }
  } else {
    message = req.session.success;
  }
  res.render('login', { title: 'Login', message: message });
});

router.post('/login', async function(req, res) {
  await authenticate(req.body.username, req.body.password, function(err, user) {
    if (user) {
      req.session.regenerate(function() {
        req.session.user = user;
        req.session.success = 'Authenticated as ' + user.name;
        if (user.pass_set) {
          res.redirect('/controller');
        } else {
          res.redirect('/users/' + user.name + '/password');
        }
      });
    } else {
      req.session.error = 'Authentication failed, please check your username and password.'
      res.redirect('/login');
    }
  });
});
module.exports = router;
