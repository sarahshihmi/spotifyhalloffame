const SpotifyWebApi = require('spotify-web-api-node');
const { User } = require('../db/models');

// initialize the api
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// generate the spotify auth url
function getSpotifyAuthUrl() {
  const scopes = [
    'user-read-private',    // access private data which includes name, profile pic, and country
    'user-read-email',      // access email
  ];
  return spotifyApi.createAuthorizeURL(scopes);
}

// give auth code for access and refresh tokens
async function getTokensFromCode(code) {
  try {
    const data = await spotifyApi.authorizationCodeGrant(code); // give code, get token
    spotifyApi.setAccessToken(data.body['access_token']); // set base token
    spotifyApi.setRefreshToken(data.body['refresh_token']); // set refresh token
    return data.body; // return tokens and expiration info
  } catch (err) {
    console.error('Error exchanging authorization code:', err);
    throw err;
  }
}

//refresh access token if expired for some reason
async function refreshAccessToken(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user || !user.refresh_token) {
      throw new Error('No refresh token found for user');
    }

    spotifyApi.setRefreshToken(user.refresh_token); // Set the user's refresh token
    const data = await spotifyApi.refreshAccessToken(); // Refresh the token
    const newAccessToken = data.body.access_token;

    // Update the user's access token in the database
    user.access_token = newAccessToken;
    await user.save();

    return newAccessToken;
  } catch (err) {
    console.error('Error refreshing access token:', err);
    throw err;
  }
}

// search artist
async function searchArtist(artistName, token) {
  try {
    spotifyApi.setAccessToken(token);
    const data = await spotifyApi.searchArtists(artistName); // call spotify api
    return data.body.artists.items; // return artists
  } catch (err) {
    console.error('Error searching for artist:', err);
    throw err;
  }
}

// search for a song
async function searchTrack(trackName, token) {
  try {
    spotifyApi.setAccessToken(token);
    const data = await spotifyApi.searchTracks(trackName); // call spotify api
    return data.body.tracks.items; // return tracks
  } catch (err) {
    console.error('Error searching for track:', err);
    throw err;
  }
}


module.exports = {spotifyApi, getSpotifyAuthUrl, getTokensFromCode, refreshAccessToken, searchArtist, searchTrack};
