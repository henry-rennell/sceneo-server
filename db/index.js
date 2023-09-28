const { Pool } = require('pg')
require('dotenv').config();
let pool;

if(process.env.NODE_MODE === 'production') {
    pool = new Pool({
        database: process.env.DATABASE,
        user: process.env.USER,
        password: process.env.PASSWORD
    });

} else if (process.env.NODE_MODE === 'development') {
    pool = new Pool({
        connectionString: process.env.CONNECTION_STRING
    });
}



module.exports = pool;