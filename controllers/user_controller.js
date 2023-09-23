const pool = require('../db')
const express = require('express');
const router = express.Router();
const path = require('path')
const fs = require('fs');
const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename:(req, file, cb ) => {
        cb(null, 'pfp')
    }
})
const upload = multer({ storage })
const bcrypt = require('bcrypt');
const { uploadProfilePicture } = require('../s3')
const generateRandomCode = require('../functions/codeGenerator');
const textArrayConverter = require('../functions/textArrayConverter')



//getting a user's posts
router.get('/users/:username', (req, res, next) => {
   let username = req.params.username;

    let sql = `select * from gigs where username = $1;`

        pool.query(sql, [username], (err, dbRes) => {
             if(err) {
                console.log(err)
                next(err)
            }
             return res.json(dbRes.rows)
        })
})

//route that creates a new user in database
router.post('/users',  upload.single('image'), async (req, res, next) => {
    const saltRounds = 10;
    console.log('route called')
    
    if (!req.file) {
        // If no image is uploaded, throw an error and send a message to the client
        const error = new Error('No image uploaded');
        error.status = 400; // Set the status code for a bad request
        next(error); // Pass the error to the error handling middleware
        return;
      }
    //declaring path for uploaded image
    const image = req.file;
    const imagePath = req.file.path;
    const formattedInterests = textArrayConverter(req.body.interests)
    const user_id = (Date.now().toString() + generateRandomCode()).toString();

    try {
         bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
            if(err) next(err)
            const sql = `insert into users (username, user_name, user_city, email, password_digest, account_type, interests, user_id) values ($1, $2, $3, $4, $5, $6, $7, $8);`
            //adding user to database.
            pool.query(sql, [req.body.username, req.body.user_name, req.body.city, req.body.email, hash, req.body.account_type, formattedInterests, user_id], (err, dbRes) => {
                if (err) {
                    next(err)
                    
                } else {
                    res.send({response: 200})
                }
                fs.unlink(imagePath, ((unlinkErr) => {
                    if (unlinkErr) console.log(unlinkErr)
                }))
            })
        })
    } catch (err) {
        next(err)
    }

    //converting image to binary
    let result =  await uploadProfilePicture(image, req.body.username);
    let image_key = result.Key; 

})

router.get('/users/saved/:user_id', (req, res, next) => {
    const user_id = req.params.user_id;

    const sql = `
        SELECT g.*
        FROM gigs g
        WHERE g.gig_id IN (
            SELECT unnest(saved) AS saved_gig_id
            FROM users
            WHERE user_id = $1
        );
    `

    try {
        pool.query(sql, [user_id], (err, dbRes) => {
            res.send(dbRes.rows);
        })
    } catch(err) {
        next(err);
    }

})

//route that allows users to save gigs to their "saved" column
router.post('/users/saved/:gig_id/:user_id', (req, res, next) => {

    const gig_id = req.params.gig_id;
    const user_id = req.params.user_id;

    const sql = `update users set saved = array_append(saved, $1) where user_id = $2;`

    try {
        pool.query(sql, [gig_id, user_id], (err, dbRes) => {
            res.send(`successfully saved ${gig_id}`)
        })
    } catch (err) {
        console.log(err)
        next(err)
    }
})

//route to remove saved gig from users "saved" column
router.delete('/users/saved/:gig_id/:user_id', (req, res, next) => {

    const gig_id = req.params.gig_id
    const user_id = req.params.user_id;

    const sql = `update users set saved = array_remove(saved, $1) where user_id = $2;`

    try {
        pool.query(sql, [gig_id, user_id], (err, dbRes) => {
            res.send(`successfully deleted item ${gig_id}`)
        })
    } catch (err) {
        console.log(err)
        next(err)
    }




})

// router.use(errorHandler)

module.exports = router;
