import express, { Request, Response } from "express";

import { body, validationResult } from "express-validator";
import { Post, hasRole, permissionLevels, loggedIn } from "../../config";
import { authenticate } from "passport";

// TODO: remove this file
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
    if (req.query.date)
        posts = posts.filter((p) => {
            return p.get("createdAt").toString() === (req.query.date as string);
        });
    if (req.query.category)
        posts = posts.filter((p) => {
            return (
                p.get("category").toString() === (req.query.category as string)
            );
        });
    res.json(posts);
});

router.get("/post/:id", async (req: Request, res: Response) => {
    const post = await Post.findOne({ _id: req.params.id || "" });
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
        body("title").notEmpty(),
        body("description").notEmpty(),
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
        req.body.createdAt = new Date().getTime();
        req.body.author = req.user.name;
        if (!req.body.category) req.body.category = "Uncategorized";
        Post.updateOne({ title: req.body.title }, req.body, {
            upsert: true,
        })
            .then(async (result) =>
                res.status(201).json({
                    message: "Post created or updated",
                    result,
                }),
            )
            .catch((err) => res.status(500).json({ message: err.toString() }));
    },
);

export const blogRouter = router;
