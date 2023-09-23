const port = process.env.PORT || 3000;
const express = require('express');
const app = express();
const cors = require("cors");
app.use(cors());
app.use(express.json());
const session = require('express-session');
const MemoryStore = require('memorystore')(session)

//CONTROLLERS
const gigController = require('./controllers/gig_controller');
const userController = require('./controllers/user_controller')
const imageController = require('./controllers/image_controller') 
const sessionController = require('./controllers/session_controller')

//Middlewares 
const errorHandler = require('./middlewares/errorHandler')
const sessionVerification = require('./middlewares/sessionVerification')

app.use(session({
    cookie: { maxAge: 86400000 },

    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));


app.use(express.urlencoded({extended: true})); 
// app.use(sessionVerification)

//initiating controller routing
app.use('/', gigController);
app.use('/', userController);
app.use('/', imageController);
app.use('/', sessionController)

app.use(errorHandler);



app.listen(port, () => {
    console.log(`listening on port ${port}`)
})
