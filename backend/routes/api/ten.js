const express = require('express')
const router = express.Router()
const { check } = require('express-validator')
const { handleValidationErrors } = require('../../utils/validation')
const restoreUser = require('../../utils/restoreuser');
const requireAuth = require('../../utils/auth');
const { Ten } = require('../../db/models')

router.use(requireAuth);

const validateTenEntry = [
    check('artist_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Artist name is required.'),
    check('song_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Song name is required'),
    check('rank').exists({checkFalsy:true}).isInt({min:1, max:15}).withMessage('Rank must be an integer between 1 and 15.'),
    handleValidationErrors
]   

//GET top 10 entries
router.get('/', async (req, res) => {
    try{
        const tenEntries= await Ten.findAll({
            where: { user_id: req.user.id },
            order:[['rank', 'ASC']]
        })
        return res.json(tenEntries)
    } catch (err){
        console.error('Error fetching Top Ten entries', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})


//POST top 10 entries
router.post('/', validateTenEntry, async (req, res) => {
    const { artist_name, song_name, rank } = req.body

    if (rank < 1 || rank > 15) {
        return res.status(400).json({ error: 'Rank must be between 1 and 15.' });
    }

    try{
        const entryCount = await Ten.count({ where: { user_id: req.user.id } });

        if (entryCount >= 15) {
        return res.status(400).json({ error: 'You can only have 10 entries + 5 honorable mentions in your Top Ten list.' });
        }

        const rankConflict = await Ten.findOne({
            where: { user_id: req.user.id, rank }
        });
        
        if (rankConflict) {
            return res.status(400).json({ error: 'This rank is already assigned to another entry.' });
        }

        const newEntry = await Ten.create({
            user_id: req.user.id,
            artist_name, 
            song_name, 
            rank
        })
        res.status(201).json({message: 'Top Ten List entry updated successfully', newEntry})
    } catch (err){
        console.error('Error creating Top Ten entry', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})

//PUT top 10 entries
router.put('/:id', validateTenEntry, async (req, res)=> {
    const { id } = req.params

    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid entry ID.' });
    }

    
    try{
        const { artist_name, song_name, rank } = req.body

        const [rankConflict, entry] = await Promise.all([
            Ten.findOne({ where: { user_id: req.user.id, rank } }),
            Ten.findOne({ where: { id, user_id: req.user.id } })
        ]);
        
        if (!entry) {
            return res.status(404).json({ error: 'Top Ten entry does not exist' });
        }
        
        if (rankConflict && rankConflict.id !== parseInt(id)) {
            return res.status(400).json({ error: 'This rank is already assigned to another entry.' });
        }

        entry.artist_name = artist_name
        entry.song_name = song_name
        entry.rank = rank
        await entry.save()
        return res.status(200).json({message:'Top Ten List entry updated successfully', entry})
    } catch (err) {
        console.error('Error updating Top Ten entry', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})


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