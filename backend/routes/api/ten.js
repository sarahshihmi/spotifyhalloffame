const express = require('express')
const router = express.Router()
const { check } = require('express-validator')
const { handleValidationErrors } = require('../../utils/validation')
const requireAuth = require('../../utils/auth');
const { Ten } = require('../../db/models')
const { searchTrack } = require('../../utils/spotify')
const { Sequelize } = require('sequelize');
const { sequelize } = require('../../db/models')

router.use(requireAuth);

const validateTenEntryPost = [
    check('artist_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Artist name is required.'),
    check('artist_id').exists({ checkFalsy: true }).isString().withMessage('Artist ID is required.'),
    check('song_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Song name is required'),
    check('song_id').exists({ checkFalsy: true }).isString().withMessage('Song ID is required'), // Ensure song_id is validated
    check('rank').exists({ nullable: true }).isInt({ min: 1, max: 15 }).withMessage('Rank must be an integer between 1 and 15.'), 
    handleValidationErrors
]   

const validateTenEntryPut = [
    check('artist_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Artist name is required.'),
    check('artist_id').exists({ checkFalsy: true }).isString().withMessage('Artist ID is required.'),
    check('song_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Song name is required'),
    check('song_id').exists({ checkFalsy: true }).isString().withMessage('Song ID is required'), // Ensure song_id is validated
    check('rank').optional({ nullable: true }).isInt({ min: 1, max: 15 }).withMessage('Rank must be an integer between 1 and 15.'), // Optional for PUT
    handleValidationErrors
]   

//GET top 10 entries
router.get('/', async (req, res) => {
    try {
        const tenEntries = await Ten.findAll({
            where: { user_id: req.user.id },
            order: [['rank', 'ASC']],
            attributes: ['id', 'artist_name', 'song_name', 'artist_id', 'song_id', 'rank'] // Include song_id in response
        });

        const token = req.user.access_token; // Retrieve user's access token
        const enrichedEntries = await Promise.all(
            tenEntries.map(async (entry) => {
                try {
                    const searchResults = await searchTrack(entry.song_name, token); // Fetch track data from Spotify

                    const track = searchResults.tracks.items.find(
                        (track) =>
                            track.id === entry.song_id && // Match song_id to ensure correct track
                            track.artists.some((artist) => artist.id === entry.artist_id) // Match artist_id to ensure correct artist
                    );
                    if (!track) {
                        console.error(`No match found for "${entry.song_name}" by "${entry.artist_name}"`);
                        return { ...entry.toJSON(), albumImage: null };
                    }

                    // Include album image in the enriched entry
                    return { ...entry.toJSON(), albumImage: track?.album.images?.[0]?.url || null };
                } catch (err) {
                    console.error(`Error fetching image for song "${entry.song_name}":`, err);
                    return { ...entry.toJSON(), albumImage: null }; // Fallback to null if image fetch fails
                }
            })
        );

        res.status(200).json({ status: 'Top Ten entries retrieved successfully', data: enrichedEntries });
    } catch (err) {
        console.error('Error fetching Top Ten entries', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

//POST top 10 entries
router.post('/', validateTenEntryPost, async (req, res) => {
    const { artist_name, artist_id, song_name, song_id, rank } = req.body;

    if (rank < 1 || rank > 15) {
        return res.status(400).json({ error: 'Rank must be a whole number between 1 and 15.' });
    }

    try {
        // Check if the user already has a song with the same ID
        const songConflict = await Ten.findOne({
            where: { user_id: req.user.id, song_id }
        });

        if (songConflict) {
            return res.status(409).json({
                status: 'conflict',
                message: `You already have an entry for the song "${song_name}" by "${artist_name}".`,
                data: songConflict
            });
        }

        // Check if the rank is already occupied
        const rankConflict = await Ten.findOne({
            where: { user_id: req.user.id, rank }
        });

        if (rankConflict) {
            return res.status(409).json({
                status: 'conflict',
                message: `Rank ${rank} is already occupied by the song "${rankConflict.song_name}" by "${rankConflict.artist_name}".`,
                data: rankConflict
            });
        }

        // Proceed with creating a new entry
        const newEntry = await Ten.create({
            user_id: req.user.id,
            artist_name,
            artist_id,
            song_name,
            song_id,
            rank
        });

        res.status(201).json({ message: 'Top Ten List entry created successfully', newEntry });
    } catch (err) {
        console.error('Error creating Top Ten entry', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// PUT top 10 entries
router.put('/:id', validateTenEntryPut, async (req, res) => {
    const { id } = req.params;
  
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid entry ID.' });
    }
  
    const transaction = await sequelize.transaction();
    try {
      const { artist_name, artist_id, song_name, song_id, rank } = req.body;
  
      console.log('Rank being updated to:', rank);
  
      const entry = await Ten.findOne({ where: { id, user_id: req.user.id }, transaction });
  
      if (!entry) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Top Ten entry does not exist' });
      }
  
      if (typeof rank !== 'undefined' && rank !== null) {
        const newRank = parseInt(rank, 10);
  
        if (isNaN(newRank) || newRank < 1 || newRank > 15) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Rank must be a whole number between 1 and 15.' });
        }
  
        const oldRank = entry.rank;
  
        if (oldRank !== newRank) {
          const rankConflict = await Ten.findOne({
            where: { user_id: req.user.id, rank: newRank, id: { [Sequelize.Op.ne]: id } },
            transaction,
          });
  
          if (rankConflict) {
            // Delete the conflicting entry at the target rank
            await rankConflict.destroy({ transaction }); // CHANGE HERE: Delete conflicting entry
  
            // Update the entry's rank to the new rank
            entry.rank = newRank;
            await entry.save({ transaction });
          } else {
            // No conflict, update rank directly
            entry.rank = newRank;
            await entry.save({ transaction });
          }
        }
      }
  
      // Update other fields if provided
      if (artist_name) entry.artist_name = artist_name;
      if (song_name) entry.song_name = song_name;
      if (artist_id) entry.artist_id = artist_id;
      if (song_id) entry.song_id = song_id;
  
      await entry.save({ transaction });
  
      await transaction.commit();
      return res.status(200).json({ message: 'Top Ten List entry updated successfully', entry });
    } catch (err) {
      await transaction.rollback();
      console.error('Error updating Top Ten entry', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


//DELETE top 10 entry
router.delete('/:id', async(req, res)=>{
    const { id } = req.params

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid entry ID.' });
    }

    try{
        const entry = await Ten.findOne({
            where: { id, user_id: req.user.id }
        })

        if (!entry){
            return res.status(404).json({error: 'Top Ten entry not found'})
        }

        await entry.destroy()
        return res.status(200).json({message: 'Entry successfully destroyed'})
    } catch (err){
        console.error('Error deleting Top Ten entry', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})

module.exports = router
