const express = require('express');
const router = express.Router();
const path = require('path')
const pool = require('../db')
const multer = require('multer');
const fs = require('fs')
require('dotenv')

//gathering modules written for this program
const generateRandomCode = require('../functions/codeGenerator')
const textArrayConverter = require('../functions/textArrayConverter')
const { uploadFile, deleteImages, } = require('../s3')
const isLoggedIn = require('../middlewares/isLoggedIn');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename:(req, file, cb ) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage })

//gets all gigs
router.get('/gigs/all',  async (req, res, next) => {

    try {
        const sql = `SELECT * FROM gigs;`;
        pool.query(sql, (err, dbRes) => {
            if (err) {
                next(err)
            }
            if(!Object.keys(dbRes).includes('rows')) {
                res.send('no gigs to display sorry...')
            } else if(dbRes.rows) {
                res.send(dbRes.rows)
            }
        })

    } catch (err) {
        next(err)
    }
})

//search route
router.get('/gigs/search', (req, res, next) => {
    let param, search
    //defining search parameters that are allowed to prevent sql attacks to db
    const allowedSearches = ['artist', 'title', 'keywords', 'venue_name', 'date', 'city'];

    //checking if permitted parameters includes the supplied parameter, if not the server will respond with a message instead of continuing
    if (allowedSearches.includes(Object.keys(req.query)[0])) {
        
        param = Object.keys(req.query)[0];
        search = Object.values(req.query)[0];

    } else {
        //sending result back to front end
        return res.send('issue with search parameter')

    }

    //main logic sorting for the route,
    if(param === 'date') {
        try {
            let sql = `
                SELECT * FROM GIGS WHERE DATE = $1;
            `
            pool.query(sql, [search], (err, dbRes) => {
                if (err) console.log(err)

                return res.send(dbRes.rows)
            })


        } catch (err) {
        }
    } else if (param === 'keywords') {
        let sql = `
            SELECT *
            FROM gigs
            WHERE EXISTS (
                SELECT 1
                FROM unnest(keywords) AS keyword
                WHERE keyword ILIKE '%' || $1 || '%'
            );
        `;
        try {
            pool.query(sql, [search], (err, dbRes) => {
                if (err) console.log(err)
                return res.send(dbRes.rows)
            })
        } catch (err) {
            next(err)
        }

    } else {
        //if the parameter doesnt meet either of the special cases, it will do a generic sql query
        try {
            let sql = `
                SELECT *
                FROM gigs
                WHERE LOWER(${param}) LIKE LOWER('%' || $1 || '%');
            `;
    
            pool.query(sql, [search], (err, dbRes) => {
                if(err)console.log(err)

                return res.send(dbRes.rows);
            })
    
        } catch (err) {
            next(err)
        }
        
    }
})


//get information for single gig specified in req params
router.get('/gigs/:gig_id',  (req, res, next) => {
    let id = req.params.gig_id;
    const sql = `SELECT * FROM gigs WHERE gig_id = $1`;
    try {
        pool.query(sql, [id], (err, dbRes) => {
            if (err) {
                next(err)
            }
            return res.json(dbRes.rows)
        })

    } catch (err) {
        next(err)
    }
})

//updates gig information based on front end's update gig feature
router.put('/gigs/:gig_id/edit',  (req, res, next) => {

    const sql = `update gigs set title = $1, description = $2, keywords = $3, address = $4, date = $5, start_time = $6, artist= $7 where gig_id = $8;`;
    try {
        pool.query(sql, [req.body.title, req.body.description, req.body.keywords, req.body.address, req.body.date, req.body.start_time, req.body.artist, req.body.gig_id], (err, dbRes) => {
            if(err) next(err);
        })
    } catch (err) {
        next(err)
    }

})

//uploads a new gig to db and s3
router.post('/gigs', upload.single('image'), async (req, res, next) => {
    const gig_id = (Date.now().toString() + generateRandomCode()).toString();
    const data = req.body

    if(req.file) {
        let image = req.file;

        let imagePath = image.path
         
        let result =  await uploadFile(image, gig_id, data.username);

        fs.unlink(imagePath, ((unlinkErr) => {
            if (unlinkErr) console.log(unlinkErr)
        }))
    }

    try {
        //converting a string received from front end ('example1,example2,example3') to psql text[] ({"example1", "example2", "example3"})
        const formattedArray = textArrayConverter(req.body.keywords);
    
        const sqlInsertQuery = `INSERT INTO gigs (title, description, city, address, venue_name, artist, date, start_time, finish_time, keywords, username, gig_id, tickets_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING gig_id;`
    
        pool.query(sqlInsertQuery, [data.title, data.description, data.city, data.address, data.venue_name, data.artist, data.date, data.start_time, data.finish_time, formattedArray, data.username, gig_id, data.tickets_link], (err, dbRes) => {
            if (err) next(err)
            
    
            return res.send(dbRes.rows[0])
        })
    } catch(err) {
        next (err)
    }

})

//deletes specific gig from db and s3
router.delete('/gigs/:username/:gig_id', (req, res, next) => {

    let id = req.params.gig_id;
    let username = req.params.username;
    //setting desired s3 path for deletion
    const path = `users/${username}/posts/${id}`;

    const sql = `DELETE FROM gigs WHERE gig_id = $1;`;
    try {
        pool.query(sql, [id], (err, dbRes) => {
            if(err) next(err);
        })
    
        //calling function to delete images at desired path in s3 bucket (gig folder)
        deleteImages(path)
    } catch (err) {
        next(err)
    }    
    

})

//starting to get gigs based on user interest,
router.get('/gigs/interests/:username', async (req, res, next) => {
    const username = req.params.username;

    //returning the interests of the user in order to make another query for gigs based on those interests
    const sql = `select interests, user_city from users where username = $1;`

    try {  
            pool.query(sql, [username], (err, dbRes) => {
                if(err) console.log(err, 'first query')
        
                //in order to do proper search, results need to be set in LowerCase
                let city = dbRes.rows[0].user_city.toLowerCase();
                
                let interests = (dbRes.rows[0].interests);
                
        
                let sql = `
                    SELECT *
                    FROM gigs
                    WHERE EXISTS (
                        SELECT 1
                        FROM unnest(keywords) AS gig_keyword
                        WHERE LOWER(gig_keyword) = ANY(ARRAY[LOWER($1), LOWER($2), LOWER($3), LOWER($4), LOWER($5)])
                    )
                    AND LOWER(city) = LOWER($6);
                `
                
                //incase the user has less than the maximum 5 interests
                if (interests.length < 5) {
                    for(let i = 0; i < 5 - interests.length; i++) {
                        interests.push('');
                    }
                }
                
                //second query, each value in the users interests array is being sanitised to make sure there is no injection possible, (it looks clunky but is very functional) returns all of the gigs with overlap in the users interests
                pool.query(sql, [interests[0], interests[1], interests[2], interests[3], interests[4], city], (err, result) => {
                    if(err) console.log(err)
                    //returning the result
                    if(dbRes.rows.length === 0) {
                        return res.send('Sorry, No Gigs To Display....')
                    }
                    res.send(result.rows)
                })
        })
    } catch (err) {
        next(err)
    }
    

})

router.post('/seed', upload.single('image'), async (req, res, next) => {
    const gig_id = (Date.now().toString() + generateRandomCode()).toString();
    const data = req.body

    if(req.file) {
        console.log('file confirmed')
        let image = req.file;

        let imagePath = image.path
         
        let result =  await uploadFile(image, gig_id, data.username);

        fs.unlink(imagePath, ((unlinkErr) => {
            if (unlinkErr) console.log(unlinkErr)
        }))
    }

    //converting a string received from front end ('example1,example2,example3') to psql text[] ({"example1", "example2", "example3"})
    const formattedArray = textArrayConverter(req.body.keywords);

    const sqlInsertQuery = `INSERT INTO gigs (title, description, city, address, venue_name, artist, date, start_time, finish_time, keywords, username, gig_id, tickets_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING gig_id;`

    pool.query(sqlInsertQuery, [data.title, data.description, data.city, data.address, data.venue_name, data.artist, data.date, data.start_time, data.finish_time, formattedArray, data.username, gig_id, data.tickets_link], (err, dbRes) => {
        if (err) next(err)
        

        return res.send(dbRes.rows[0])
    })

})



module.exports = router;