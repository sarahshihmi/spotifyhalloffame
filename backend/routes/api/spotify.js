const express = require('express')
const { spotifyApi, getSpotifyAuthUrl, refreshAccessToken, getTokensFromCode, searchArtist, searchTrack } = require('../../utils/spotify');
const { User } = require('../../db/models');
const  restoreUser  = require('../../utils/restoreuser');
const router = express.Router()
const jwt = require('jsonwebtoken');

router.use(restoreUser);

//redirect route to spotify login
router.get('/login', (req, res)=> {
    const authUrl = getSpotifyAuthUrl() //calling on the method that we defined in utility
    res.redirect(authUrl) //redirect
})

//callback from the spotify login page
router.get('/callback', async (req, res) => {
  try {
    const tokens = await getTokensFromCode(req.query.code);
    const spotifyUserData = await spotifyApi.getMe();

    const [user] = await User.findOrCreate({
      where: { spotify_id: spotifyUserData.body.id },
      defaults: {
        email: spotifyUserData.body.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
    });

    const payload = { id: user.id };
    const appToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('Generated app token:', appToken); // Debugging

    res.redirect(`http://localhost:5173/hall?token=${appToken}`);
  } catch (err) {
    console.error('Error in callback:', err);
    res.redirect('http://localhost:5173/login?error=spotify_auth_failed');
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('No token provided in Authorization header');
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    // Verify the JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('Error verifying JWT:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch the user from the database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.error('User not found for ID:', decoded.id);
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      spotifyApi.setAccessToken(user.access_token);
      const spotifyUserData = await spotifyApi.getMe(); // Fetch Spotify user data

      return res.json({ user: spotifyUserData.body }); // Send user data to the frontend
    } catch (err) {
      // If the token is expired, refresh it
      if (err.body?.error?.message === 'The access token expired') {
        try {
          console.log('Access token expired. Refreshing...');
          spotifyApi.setRefreshToken(user.refresh_token);
          const data = await spotifyApi.refreshAccessToken();
          const newAccessToken = data.body.access_token;

          // Update the user's access token in the database
          user.access_token = newAccessToken;
          await user.save();

          // Retry the Spotify API call with the refreshed token
          spotifyApi.setAccessToken(newAccessToken);
          const spotifyUserData = await spotifyApi.getMe();

          return res.json({ user: spotifyUserData.body });
        } catch (refreshError) {
          console.error('Error refreshing Spotify token:', refreshError);
          return res.status(500).json({ error: 'Failed to refresh access token' });
        }
      }

      console.error('Error fetching Spotify user data:', err);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


//search artists
router.get('/search-artists', async (req, res)=>{
    const { query } = req.query
    if (!query) {
        return res.status(400).json({error: 'Please enter an artist'})
    }

    try{
        const token = req.user.access_token; // Retrieve the user's token
        if (!token) {
          return res.status(401).json({ error: 'No access token found. Please log in.' });
        }

        const artists = await searchArtist(query, token)
        res.status(200).json(artists)
    } catch (err) {
        // If the token is expired, refresh it
        if (err.body?.error?.message === 'The access token expired') {
          try {
            token = await refreshAccessToken(req.user.id); // Refresh the token
            const artists = await searchArtist(query, token); // Retry the request with new token
            return res.status(200).json(artists);
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            return res.status(500).json({ error: 'Could not refresh access token' });
          }
        }
        console.error('Error in /search-artists', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
})


router.get('/search-tracks', async (req, res) => {
  const { query, artistId } = req.query;

  if (!query || !artistId) {
    return res.status(400).json({ error: 'Please provide both a track name and an artist ID' });
  }

  try {
    const token = req.user.access_token;
    if (!token) {
      return res.status(401).json({ error: 'No access token found. Please log in.' });
    }

    // Fetch tracks using Spotify API
    const searchResults = await searchTrack(query, token);
    console.log("Raw Spotify API response:", JSON.stringify(searchResults, null, 2));

    // Filter tracks to ensure they belong to the provided artistId
    const filteredTracks = searchResults.tracks.items.filter((track) =>
      track.artists.some((artist) => artist.id === artistId)
    );

    if (!filteredTracks.length) {
      return res.status(404).json({ error: 'No tracks found for the given artist' });
    }

    res.status(200).json({ tracks: filteredTracks });
  } catch (err) {
    if (err.body?.error?.message === 'The access token expired') {
      try {
        const refreshedToken = await refreshAccessToken(req.user.id);
        const searchResults = await searchTrack(query, refreshedToken);

        const filteredTracks = searchResults.tracks.items.filter((track) =>
          track.artists.some((artist) => artist.id === artistId)
        );

        if (!filteredTracks.length) {
          return res.status(404).json({ error: 'No tracks found for the given artist' });
        }

        return res.status(200).json({ tracks: filteredTracks });
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return res.status(500).json({ error: 'Could not refresh access token' });
      }
    }

    console.error('Error in /search-tracks:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;