const { Pool } = require('pg')
require('dotenv').config();

const pool = new Pool({
    database: process.env.DATABASE,
    user: process.env.USER,
    password: process.env.PASSWORD
});


module.exports = pool;