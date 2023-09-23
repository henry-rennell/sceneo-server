require('dotenv').config()
const fs = require('fs')
const AWS = require('aws-sdk')
const e = require('express')

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new AWS.S3({
    region,
    accessKeyId,
    secretAccessKey,
})

async function uploadUpdatedFile(file, path) {
    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: path
    }

    const upload = s3.upload(uploadParams).promise();
    return upload;
}


//uploads other images to s3 bucket
async function uploadFile(file, gig_id, username) {
    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: `users/${username}/posts/${gig_id}/${file.filename}`
    }

    return s3.upload(uploadParams).promise();

}

//uploads profile picture to s3 bucket
async function uploadProfilePicture(file, username){
    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: `users/${username}/${file.filename}`
    }

    return s3.upload(uploadParams).promise();
}

//gets presigned url for profile picture only
async function getProfilePicture (username) {

    const params = {
        Bucket: bucketName,
        Key: `users/${username}/pfp`,
    }
    try {

        const result = await s3.headObject(params).promise();
        
        params.Expires = 36000
        const url = s3.getSignedUrl('getObject', params);
        
        return url
    } catch (err) {


        return 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'

    }

}

//gets all images from a specified gig
async function getAllImages(path) {
    //setting parameters for listObjects call
    const params = {
        Bucket: bucketName,
        Prefix: path,
    };
    //waiting for s3ListObject call to return data
    const data = await s3.listObjectsV2(params).promise();

    /*
    The returned data has an array of objects named Contents, each object in the directory has an object with a "Key" value, we use this to generate presigned Urls,
    */
    const presignedUrlsPromises = data.Contents.map((image) => {
        const params = {
            Bucket: bucketName,
            Key: image.Key,
            Expires: 3600,
        };

        return s3.getSignedUrl('getObject', params);
    });

    //awaiting each of the keys in data.Contents to be assigned a presigned url
    const presignedUrls = await Promise.all(presignedUrlsPromises);
    if (presignedUrls.length === 0) {
        return 'no images';
    }
    //returning presigned Urls
    return presignedUrls;
}

//deletes s3 directory and objects inside at desired path
async function deleteImages(path) {
    
    const params = {
        Bucket: bucketName,
        Prefix: path,
    }

    let result = await s3.listObjectsV2(params).promise();

    const objectsToDelete = result.Contents.map(object => ({
        Key: object.Key,
    }))

    let call = await s3.deleteObjects({
        Bucket: bucketName, 
        Delete: {Objects: objectsToDelete}
    }).promise();

    return call;
}

//gets single image from gig (thumbnail)
async function getSingleImage(path) {

    const params = {
        Bucket: bucketName,
        Prefix: path,
    }

    //listing objects under path
    const data = await s3.listObjectsV2(params).promise();

    if (data.Contents.length === 0) {
        return 'no images';
    }

    
    //object key of the first object found in path
    let Key = data.Contents[0].Key

    let getParams = {
        Bucket: bucketName,
        Key,
        Expires: 3600,
    }

    //getting url for specified key
    const presignedUrl = s3.getSignedUrl('getObject', getParams);

    return presignedUrl
}


module.exports = { getSingleImage, getAllImages, uploadFile, deleteImages, uploadProfilePicture, getProfilePicture, uploadUpdatedFile }