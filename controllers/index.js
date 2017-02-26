var express = require('express');
var router = express.Router();

// Configuring Routes
router.use('/authenticate',require('./api/authenticate'));
router.use('/register',require('./api/register'));
router.use('/subscribe',require('./api/subscribe'));
router.use('/sources',require('./api/sources'));

module.exports = router;
