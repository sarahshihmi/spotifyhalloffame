const router = require('express').Router();
const spotifyRouter = require ('./spotify.js');
const hallRouter = require('./hall.js');
const tenRouter = require('./ten.js');


// Connect restoreUser middleware to the API router
  // If current user session is valid, set req.user to the user in the database
  // If current user session is not valid, set req.user to null




router.use('/spotify', spotifyRouter);

router.use('/hall', hallRouter);

router.use('/ten', tenRouter);

router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;