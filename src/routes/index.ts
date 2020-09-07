import ytdl from "ytdl-core";
import express from "express";
import { authRouter } from "./auth";
import { blogRouter } from "./blog/blog";
import { Project } from "../config";
import { urlGoogle } from "../google-util";

const router = express.Router();

// Sub routers
router.use("/auth", authRouter);
router.use("/blog", blogRouter);
// -----------

router.get("/", (_, res) => {
    res.json({ message: "Hello, world! This is an api." });
});

router.get("/convert/ytmp3", (req, res) => {
    try {
        const url = req.query.url.toString();
        res.header("Content-Disposition", 'attachment; filename="audio.mp3"');
        ytdl(url, {
            filter: "audioonly",
        }).pipe(res);
    } catch (err) {
        res.status(400).end();
    }
});

router.get("/convert/ytmp4", (req, res) => {
    try {
        const url = req.query.url.toString();
        res.header("Content-Disposition", 'attachment; filename="video.mp4"');
        ytdl(url, {}).pipe(res);
    } catch (err) {
        res.status(400).end();
    }
});

router.get("/dashboard/google", (_, res) => {
    res.render("dashboard/google", { googleUrl: urlGoogle() });
});

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

export default router;
