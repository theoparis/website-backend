import express, { Request, Response } from "express";

import { body, validationResult } from "express-validator";
import { Post, hasRole, permissionLevels, loggedIn } from "../../config";
import { authenticate } from "passport";

const router = express.Router();

router.get("/posts", async (req, res) => {
    let posts = await Post.find({});
    if (req.query.search)
        posts = posts.filter(
            (p) =>
                p.get("title") != "" &&
                p
                    .get("title")
                    .toLowerCase()
                    .includes(req.query.search as string),
        );
    res.json(posts);
});

router.get("/post/:id", async (req: Request, res: Response) => {
    const post = await Post.findOne({ _id: req.params.id || "" });
    res.json(post);
});

router.get("/posts", async (_, res: Response) => {
    const post = await Post.findOne({});
    res.json(post);
});

router.delete("/post", loggedIn, async (req: Request, res: Response) => {
    if (!(await hasRole(req, permissionLevels.writer)))
        return res.status(400).json({
            message: "You do not have permission to perform this action.",
        });

    const result = await Post.remove(req.body);
    res.json(result);
});

router.post(
    "/post",
    loggedIn,
    [
        // username must be an email
        body("title").notEmpty(),
        // password must be at least 5 chars long
        body("content").notEmpty(),
    ],
    async (req: Request, res: Response) => {
        if (!(await hasRole(req, permissionLevels.writer)))
            return res.status(400).json({
                message: "You do not have permission to perform this action.",
            });
        // TODO: use express-validator
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.array(),
                message: "Invalid post details",
            });
        }
        req.body.createdAt = new Date();
        req.body.author = req.user.username;
        Post.findOneAndUpdate({ title: req.body.title }, req.body, {
            upsert: true,
            useFindAndModify: false,
        })
            .then(async (post) =>
                res
                    .status(201)
                    .json({ message: "Post created or updated", post: post.toJSON() }),
            )
            .catch((err) => res.status(500).json({ message: err.toString() }));
    },
);

export const blogRouter = router;
