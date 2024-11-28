const express = require('express') //defining express
const router = express.Router() //defining the router
const { check } = require('express-validator'); // this is a check
const { handleValidationErrors } = require ('../../utils/validation') //for validation
const { Hall } = require ('../../db/models') //referencing the Hall model
const restoreUser = require('../../utils/restoreuser');
const requireAuth = require('../../utils/auth'); //auth
const { searchTrack } = require('../../utils/spotify');


router.use(requireAuth);


//validation 
const validateHallEntry = [         //initiate validation object
    check('artist_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Artist name is required.'),   //checking artist name exists, has a length of 1, and an error message

    check('song_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Song name is required'),        //checking song name exists, has a length of 1, and an error message

    handleValidationErrors      //call handlevalidationerrors from our validation utility folder
]

//GET hall of fame entries
router.get('/', async(req, res)=> {                             // calling get on the router, defining the route, async function with a request and a response
    try{                                                        // initiatetry block
        const hallEntries = await Hall.findAll({                // create the object hallEntries as a result awaiting a find all in Hall model
            where: { user_id: req.user.id },                    // filter out the stuff only for the current user
            order: [['createdAt', 'DESC']]                      // order is in double array, createdAt, descending.
        })
        
        const token = req.user.access_token // retrieve the user's access token
        const enrichedEntries = await Promise.all( // enrich each entry with album image data from Spotify
            hallEntries.map(async (entry) => {
                try {
                    console.log(`Fetching Spotify data for "${entry.song_name}" by "${entry.artist_name}"`);
                    const searchResults = await searchTrack(entry.song_name, token) // fetch track data from Spotify
                    console.log(`Spotify API response for "${entry.song_name}":`, JSON.stringify(searchResults, null, 2));

                    const track = searchResults.tracks.items.find(track =>
                        track.name.toLowerCase() === entry.song_name.toLowerCase() &&
                        track.artists.some(artist => artist.name.toLowerCase() === entry.artist_name.toLowerCase())
                    )
                    if (!track) {
                        console.error(`No match found for "${entry.song_name}" by "${entry.artist_name}"`);
                        return { ...entry.toJSON(), albumImage: null };
                    }

                    // Include album image in the enriched entry
                    console.log(`Matching track for "${entry.song_name}" by "${entry.artist_name}":`, track);
                    return { ...entry.toJSON(), albumImage: track?.album.images?.[0]?.url || null };
                } catch (err) {
                    // Log error for missing image and return entry with null image
                    console.error(`Error fetching image for song "${entry.song_name}":`, err)
                    return { ...entry.toJSON(), albumImage: null } // fallback to null if image fetch fails
                }
            })
        )
        res.status(200).json({ status: 'Hall of Fame entries retrieved successfully', data: enrichedEntries });          //return the response with hallEntries in json.
    } catch (err) {                                             //initiate catch block with err
        console.error('Error fetching Hall of Fame entries', err)       //create console error with the error message and err
        return res.status(500).json({error: 'Internal Server Error'})   //return the response with a status of 500 and a json saying error: internal server error
    }
})




//POST hall of fame entries
router.post('/', requireAuth, validateHallEntry, async(req, res)=> {
    console.log("CSRF Token:", req.headers['x-csrf-token']);
    const { artist_name, song_name } = req.body

    try{
        // Check for existing entry for the artist
        const existingEntry = await Hall.findOne({
            where: { user_id: req.user.id, artist_name }
        });

        if (existingEntry) {
            return res.status(409).json({ 
                status: 'conflict', 
                message: `You already have an entry for ${artist_name}: ${existingEntry.song_name}`, 
                data: existingEntry 
            });
        }

        const newEntry = await Hall.create({
            user_id: req.user.id,
            artist_name, 
            song_name
        })

        
        res.status(201).json({ status: 'Hall of Fame entry added successfully', data: newEntry });
    } catch (err){
        console.error('Error adding Hall of Fame entry', err)
        return res.status(500).json({error:'Internal Server Error'})
    }
})


//PUT hall of fame entry
router.put('/:id', validateHallEntry, async(req, res)=>{
    const { id } = req.params
    const {artist_name, song_name} = req.body

    try{
        const entry = await Hall.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!entry) {
            return res.status(404).json({ status: 'error', message: 'Hall of Fame entry not found' });
        }

        entry.artist_name = artist_name
        entry.song_name = song_name
        await entry.save()
        res.status(200).json({ status: 'Hall of Fame entry updated successfully', data: entry });
    } catch (err) {
        console.error('Error editing Hall of Fame entry', err)
        return res.status(500).json({error:'Internal Server Error'})
    }
})

//DELETE hall of fame entry
router.delete('/:id', async(req, res)=> {
    const { id } = req.params
    try {
        const entry = await Hall.findOne({
            where: { id, user_id: req.user.id },
        });

        if (!entry){
            return res.status(404).json({error: 'Hall of Fame entry not found'})
        }

        await entry.destroy()
        res.status(200).json({ status: 'success', message: 'Entry successfully destroyed' });
    } catch (err) {
        console.error('Error deleting Hall of Fame entry', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})

module.exports = router;