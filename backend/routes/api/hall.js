const express = require('express') //defining express
const router = express.Router() //defining the router
const { check } = require('express-validator'); // this is a check
const { handleValidationErrors } = require ('../../utils/validation') //for validation
const { Hall } = require ('../../db/models') //referencing the Hall model

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
            order: [['createdAt', 'DESC']]                      // order is in double array, createdAt, descending.
        })          
        return res.json(hallEntries)                            //return the response with hallEntries in json.
    } catch (err) {                                             //initiate catch block with err
        console.error('Error fetching Hall of Fame entries', err)       //create console error with the error message and err
        return res.status(500).json({error: 'Internal Server Error'})   //return the response with a status of 500 and a json saying error: internal server error
    }
})

module.exports = router;


//POST hall of fame entries
router.post('/', async(req, res)=> {
    try{
        const newEntry = await Hall.create({artist_name, song_name})
        return res.status(201).json(newEntry)
    } catch (err){
        console.error('Error adding Hall of Fame entry', err)
        return res.status(500).json({error:'Internal Server Error'})
    }
})


//PUT hall of fame entry
router.put('/:id', async(req, res)=>{
    const { id } = req.params
    const {artist_name, song_name} = req.body

    try{
        const entry = await Hall.findByPk(id)

        if (!entry){
            return res.status(404).json({error: 'Hall of Fame entry not found'})
        }

        entry.artist_name = artist_name
        entry.song_name = song_name
        await entry.save()
        return res.status(200).json({message: 'Hall of Fame entry updated sucessfully'})
    } catch (err) {
        console.error('Error editing Hall of Fame entry', err)
        return res.status(500).json({error:'Internal Server Error'})
    }
})

//DELETE hall of fame entry
router.delete('/:id', async(req, res)=> {
    const { id } = req.params
    try {
        const entry = await Hall.findByPk(id)

        if (!entry){
            return res.status(404).json({error: 'Hall of Fame entry not found'})
        }

        await entry.destroy()
        return res.status(200).json({message: 'Entry sucessfully destroyed'})
    } catch (err) {
        console.error('Error deleting Hall of Fame entry', err)
        return res.status(500).json({error: 'Internal Server Error'})
    }
})