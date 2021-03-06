const express = require('express');
//const csurf = require('csurf');
const helmet = require('helmet');
//const flash = require('connect-flash');
const session = require('express-session');
const compression = require('compression');
const exphbs = require('express-handlebars');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const MongoStore = require('connect-mongodb-session')(session);
const cors = require('cors');
const permissionsPolicy = require("permissions-policy");

const homeRoute = require('./routes/home');
const sportsRoute = require('./routes/sports');
const errorMiddleware = require('./middleware/error');
const config = require('./keys/config');
const timetable = require('./public/timetable');

const app = express();
const store = MongoStore({
    collection: 'sessions',
    uri: config.MONGODB_URL
});
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
    helpers: require('./utils/hbs-helpers')
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', 'views');

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store
}));
////app.use(csurf());
//app.use(flash());
//https://npm.io/package/permissions-policy
app.use(
    permissionsPolicy({
      features: {
        fullscreen: ["self"], // fullscreen=()
        vibrate: ["none"], // vibrate=(none)
        payment: ["self"], // payment=(self "example.com")
        syncXhr: [], // syncXhr=()
      },
    })
);
app.use(
    helmet.contentSecurityPolicy({
      useDefaults: false,
      "block-all-mixed-content": true,
      "upgrade-insecure-requests": true,
      directives: {
        "default-src": [
            "'self'"
        ],
        "base-uri": "'self'",
        "font-src": [
            "'self'",
            "https:",
            "data:"
        ],
        "frame-ancestors": [
            "'self'"
        ],
        "img-src": [
            "'self'",
            "data:"
        ],
        "object-src": [
            "'none'"
        ],
        "script-src": [
            "'self'",
            "https://cdnjs.cloudflare.com"
        ],
        "script-src-attr": "'none'",
        "style-src": [
            "'self'",
            "https://cdnjs.cloudflare.com"
        ],
      },
    }),
    helmet.dnsPrefetchControl({
        allow: true
    }),
    helmet.frameguard({
        action: "deny"
    }),
    helmet.hidePoweredBy(),
    helmet.hsts({
        maxAge: 123456,
        includeSubDomains: false
    }),
    helmet.ieNoOpen(),
    helmet.noSniff(),
    helmet.referrerPolicy({
        policy: [ "origin", "unsafe-url" ]
    }),
    helmet.xssFilter()
);
app.use('/sports', sportsRoute);
app.use('/', homeRoute);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

async function start(){
    try {    
        await mongoose.connect(config.MONGODB_URL, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });


        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}..`);
        });
    }
    catch (e) {
        console.log(e);
    }
}

start();