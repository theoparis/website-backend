// Import dependencies
import express from "express";
import serverless from "serverless-http";
import flash from "express-flash";
import session from "express-session";
import cors from "cors";
import ytdl from "ytdl-core";
import passport from "passport";

import { Project } from "./config";
import { authRouter } from "./routes/auth";
import { blogRouter } from "./routes/blog/blog";

import { storeRouter } from "./routes/store";
import { urlGoogle } from "./google-util";
import { initializePassport } from "./config";

// Create http server using express
export const app = express();

/* 
If we don't use this, accessing the api from the frontend
will give us a cross origin (cors) error because they are on different ports.
Also has to be one of the first routes in order for it to work.
*/
app.use(cors());
app.use(
    session({
        secret: "12 34",
        resave: true,
        saveUninitialized: true,
        cookie: {
            domain: ".theoparis.com",
            // maxAge: 86400000, // one day
            httpOnly: false,
            path: "/",
        },
    }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());

initializePassport(passport);

const router = express.Router();

router.get("/convert/ytmp3", (req, res) => {
    const url = req.query.url.toString();
    res.header("Content-Disposition", 'attachment; filename="audio.mp3"');
    ytdl(url, {
        filter: "audioonly",
    }).pipe(res);
});

router.get("/convert/ytmp4", (req, res) => {
    const url = req.query.url.toString();
    res.header("Content-Disposition", 'attachment; filename="video.mp4"');
    ytdl(url, {}).pipe(res);
});

router.get("/", (_, res) => {
    res.json({ message: "Hello, world! This is an api." });
});

router.use("/auth", authRouter);
router.use("/store", storeRouter);
router.use("/blog", blogRouter);
router.get("/projects", async (req, res) => {
    let projectsList = await Project.find({});
    if (req.query.search)
        projectsList = projectsList.filter(
            (p) =>
                p.get("name") != "" &&
                p
                    .get("name")
                    .toLowerCase()
                    .includes(req.query.search as string),
        );
    res.json(projectsList);
});

router.get("/dashboard/google", (_, res) => {
    res.render("dashboard/google", { googleUrl: urlGoogle() });
});
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
const error404 = (req, res, html) => {
    res.status(404).send("<h1>404</h1><h2>Requested Resource Not Found</h2>");
};

app.use("/", router);

/*
 Handle all routes that do not match the others.
 If this is the last route, it can be used as a 404 handler.
 */
app.use("*", error404);
export const handler = serverless(app);
