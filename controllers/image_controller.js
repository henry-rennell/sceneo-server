const { getAllImages, getSingleImage, getProfilePicture, deleteImages, uploadFile } = require('../s3')
const express = require('express')
const router = express.Router();

const multer = require('multer');
const fs = require('fs')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename:(req, file, cb ) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage })



//route to get only the profile picture of a user
router.get('/image/profile_picture/:username', async (req, res) => {

    const username = req.params.username;

    let url = await getProfilePicture(username)
    res.send(url);
})

//route to get a single image from a gig
router.get('/image/:username/:gig_id', async (req,res) => {
    //specifying path to get desired object from s3 bucket
    let path = `users/${req.params.username}/posts/${req.params.gig_id}`;

    //waiting for external function that returns first object from desired path
    let url = await getSingleImage(path)
    //returning the generated objectURL
    res.send(url)
})

//route to get multiple images for a gig
router.get('/images/:username/:gig_id', async (req, res) => {
    //specifying path of the images requested
    let path = `users/${req.params.username}/posts/${req.params.gig_id}`;
    //this function is from s3.js, returns an array of presigned Urls for s3 objects under specified path
    getAllImages(path).then(result => {
        if (result === 500) {
            res.sendStatus('no images');
        } else {
            res.send(result)
        }
    })

})

//route to delete images for a gig
router.delete('/images/:username/:gig_id', async (req, res) => {
    const username = req.params.username;
    const id = req.params.gig_id;
    
    const path = `users/${username}/posts/${id}`;

    const result = await deleteImages(path);

})


//this route deletes the original image stored in the s3 bucket and uploads the new one, 
router.post('/images/:username/:gig_id', upload.single('image'), async (req, res) => {

    //if the user uploaded a images 
    if(req.file) {
    const username = req.params.username;
    const id = req.params.gig_id;
    const file = req.file;

    const filePath = file.path;
    //uploading the new image to s3 bucket
    const uploadImage = await uploadFile(file, id, username);
    
    //deleting image from servers filesystem after uploading
    fs.unlink(filePath, ((unlinkErr) => {
    if (unlinkErr) console.log(unlinkErr)
    }))

    let path = `users/${req.params.username}/posts/${req.params.gig_id}`;

    //waiting for external function that returns first object from desired path
    let url = await getSingleImage(path)

    return res.send(url);
    }
})


module.exports = router;