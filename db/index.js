const { Pool } = require('pg')
require('dotenv').config();


// if(process.env.NODE_MODE === 'production') {
//     pool = new Pool({
//         database: process.env.DATABASE,
//         user: process.env.USER,
//         password: process.env.PASSWORD
//     });

// } else if (process.env.NODE_MODE === 'development') {
//     pool = new Pool({
//         connectionString: process.env.CONNECTION_STRING
//     });
// }

const config = {
    dev: {
        database: process.env.DATABASE,
        user: process.env.USER,
        password: process.env.PASSWORD
    }, 

    prod: {
        connectionString: process.env.CONNECTION_STRING
    }
}

const pool = new Pool(process.env.NODE_MODE === 'production'? config.prod : config.dev);

module.exports = pool;