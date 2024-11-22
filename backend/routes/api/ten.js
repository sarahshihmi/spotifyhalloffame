const express = require('express')
const router = express.Router()
const { check } = require('express-validator')
const { handleValidationErrors } = require('../../utils/validation')
const { Ten } = require('../../db/models')

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
    try{
        const newEntry = await Ten.create({artist_name, song_name, rank})
        res.status(201).json(newEntry)
    } catch (err){
        console.error('Error adding Top Ten List entry', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})

//PUT top 10 entries
router.put('/:id', validateTenEntry, async (req, res)=> {
    const { id } = req.params
    const { artist_name, song_name, rank } = req.body
    try{
        const entry = await Ten.findByPk(id)

        if(!entry){
            return res.status(404).json({error: 'Top Ten entry does not exist'})
        }

        entry.artist_name = artist_name
        entry.song_name = song_name
        entry.rank = rank
        await entry.save()
        return res.status(200).json({message:'Top Ten List entry updated successfully'})
    } catch (err) {
        console.error('Error editing Top Ten entry', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})


//DELETE top 10 entry
router.delete('/:id', async(req, res)=>{
    const { id } = req.params
    try{
        const entry = await Ten.findByPk(id)

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