const express = require('express')
const router = express.Router()
const { check } = require('express-validator')
const { handleValidationErrors } = require('../../utils/validation')
const { Ten } = require('../../db/models')

const validateTenEntry = [
    check('artist_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Artist name is required.'),
    check('song_name').exists({checkFalsy:true}).isLength({min:1}).withMessage('Song name is required'),
    handleValidationErrors
]   

//GET top 10 entries
