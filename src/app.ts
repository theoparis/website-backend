// Import dependencies
import express from "express";
import serverless from "serverless-http";
import flash from "express-flash";
import session from "express-session";
import cors from "cors";
import ytdl from "ytdl-core";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { initializePassport } from "./config";
import router from "./routes";

// Create http server using express
export const app = express();

/* 
If we don't use this, accessing the api from the frontend
will give us a cross origin (cors) error because they are on different ports.
Also has to be one of the first routes in order for it to work.
*/
const allowedOrigins: string[] = [
    "localhost:8080",
    "localhost:3000",
    "theoparis.com",
    "api.theoparis.com",
];
app.use(
    cors({
        credentials: true,
        origin: (origin, callback) => {
            // allow requests with no origin
            // (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                var msg =
                    "The CORS policy for this site does not " +
                    "allow access from the specified Origin.";
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
    }),
);
app.use(
    session({
        secret: "12 34",
        resave: true,
        saveUninitialized: true,
    }),
);
app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 30, // limit each IP to n requests per windowMs
    }),
);
app.use(passport.initialize());
// persistent login sessions
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());

initializePassport(passport);

/* 
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '..', 'public'))

app.use('*', (req, res, next) => {
    var file = path.join(__dirname, '..', 'public', req.originalUrl)
    if (file != null && file != '') {
        if (
            req.originalUrl.startsWith('/css') ||
            req.originalUrl.startsWith('/js') ||
            req.originalUrl.startsWith('/assets') ||
            req.originalUrl.startsWith('/favicon')
        ) {
            res.sendFile(file)
        } else {
            if (req.query.error && req.query.error != null) {
                res.render(
                    file,
                    { session: req.session, error: req.query.error },
                    (err, html) => {
                        if (err) {
                            if (err.message.startsWith('Failed to lookup view'))
                                error404(req, res, html)
                        } else {
                            res.send(html)
                        }
                    }
                )
            } else {
                res.render(file, { session: req.session }, (err, html) => {
                    if (err) {
                        if (err.message.startsWith('Failed to lookup view'))
                            error404(req, res, html)
                    } else {
                        res.send(html)
                    }
                })
            }
        }
    } else {
        next()
    }
}) */

// Error handling

/*
 Handle all routes that do not match the others.
 If this is the last route, it can be used as a 404 handler.
 */
app.use("/", router);
export const handler = serverless(app);
