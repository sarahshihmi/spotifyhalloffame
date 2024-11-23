const router = require('express').Router();
const restoreUser = require('../../utils/restoreuser');
const requireAuth = require('../../utils/auth');
const spotifyRouter = require ('./spotify.js');
const hallRouter = require('./hall.js');
const tenRouter = require('./ten.js');


// Connect restoreUser middleware to the API router
  // If current user session is valid, set req.user to the user in the database
  // If current user session is not valid, set req.user to null


router.use(restoreUser); 

router.use('/spotify', spotifyRouter);

router.use('/hall', requireAuth, hallRouter);

router.use('/ten', requireAuth, tenRouter);

router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;