/*
  ztncui - ZeroTier network controller UI
  Copyright (C) 2017-2021  Key Networks (https://key-networks.com)
  Licensed under GPLv3 - see LICENSE for details.
*/

const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth');
const restrict = auth.restrict;
const usersController = require('../controllers/usersController');

// GET request for users
router.get('/', restrict, usersController.users_list);

// GET request for password
router.get('/:name/password', restrict, usersController.password_get);

// POST request for password
router.post('/:name/password', restrict, usersController.password_post);

// GET request for user create
router.get('/create', restrict, usersController.user_create_get);

// POST request for user create
router.post('/create', restrict, usersController.user_create_post);

// GET request for user delete
router.get('/:name/delete', restrict, usersController.user_delete);

// POST request for user delete
router.post('/:name/delete', restrict, usersController.user_delete);

module.exports = router;
