const express = require('express')
const { spotifyApi, getSpotifyAuthUrl, getTokensFromCode, searchArtist, searchTrack } = require('../../utils/spotify');
const { User } = require('../../db/models');
const router = express.Router()

//redirect route to spotify login
router.get('/login', (req, res)=> {
    const authUrl = getSpotifyAuthUrl() //calling on the method that we defined in utility
    res.redirect(authUrl) //redirect
})

//callback from the spotify login page
router.get('/callback', async (req, res)=> {
    const { code, error } = req.query       //the code is in the query (the url)

    if (error) {
        console.log('Spotify auth error', error)
        return res.status(400).json({error: 'Authentication failed'})
    }

    try {
        const tokens = await getTokensFromCode(code) //we're getting tokens from the code
        const spotifyUserData = await spotifyApi.getMe() //user data from token

        const [user, created] = await User.findOrCreate({ //find or create an entry
            where: {spotify_id: spotifyUserData.body.id},   //where the userdata id is the same as spotify_id
            defaults: {                                     //defaults are specific to findOrCreate
                email:spotifyUserData.body.email,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
            }
        })

        res.status(200).json({
            message:'Authentication successful',
            user,
            tokens,
        })

    } catch (err) {
        console.error('Error handling Spotify callback', err)
        res.status(500).json({error: 'Internal Server Error'})
    }
})

//search artists
router.get('/search-artists', async (req, res)=>{
    const { query } = req.query
    if (!query) {
        return res.status(400).json({error: 'Please enter an artist'})
    }

    try{
        const artists = await searchArtist(query)
        res.status(200).json(artists)
    } catch (err) {
        console.error('Error in /search-artists', err)
        res.status(500).json({error:'Internal Server Error'})
    }
})


router.get('/search-tracks', async (req, res) =>{
    const { query } = req.query
    if (!query){
        return res.status(400).json({error: 'Please enter a track name'})
    }

    try{
        const tracks = await searchTrack(query)
        res.status(200).json(tracks)
    } catch (err) {
        console.error('Error in /search-tracks', err)
        res.status(500).json({error:'Internal Server Error'})
    }
})
module.exports = router;