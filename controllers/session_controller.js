const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const generateRandomCode = require('../functions/codeGenerator')


//logging in and creating session
router.post('/sessions', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    const session_id = (Date.now().toString() + generateRandomCode()).toString();

    //check if the user is in the database
    const sql = `select * from users where username = $1 or email = $1`;

    pool.query(sql, [username], (err, dbRes) => {

        //if database returns nothing, the route will not continue further
        if(dbRes.rows.length === 0) {
            return res.send('username does not exist...')
        }

        //dbRes.rows[0] is the result from database if one exists
        const user = dbRes.rows[0];

        //comparing entered password with the hash stored in db
        bcrypt.compare(password, user.password_digest, (err, result) => {
            if(err) console.log(err);
            //if password comparison is complete
            if(result) {
                //creating session parameters
                req.session.session_id = session_id;
                req.session.username = user.username;
                req.session.user_id = user.user_id;
                req.session.saved = user.saved;

                return res.json(req.session)
            } else {
                //if the password comparison fails
                return res.send(200, 'Incorrect Login Details')
            }
        })

    })

})

//route that handles log out
router.delete('/sessions', (req, res) => {
    //deleting session (logging out)
    req.session.destroy(() => {
        res.send('Successfully Logged Out')
    })
})

//route for the front end to obtain session information
router.get('/session', (req, res) => {
    if (req.session) {
        return res.json(req.session);
    } else {
        return res.send(null);
    }
})


module.exports = router