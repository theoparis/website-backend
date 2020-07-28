import express from "express";

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

router.get("/post", async (req, res) => {
    const post = await Post.findOne({ title: req.query.title || "" });
    res.json(post);
});

router.delete("/admin/deletePost", authenticate('jwt', { session: true }), async (req, res) => {
    if (await hasRole(req, permissionLevels.writer))
        return res.status(400).json({
            message: "You do not have permission to perform this action.",
        });

    const result = await Post.remove(req.body);
    res.json(result);
});

router.post("/admin/createPost", authenticate('jwt', { session: true }), async (req, res) => {
    if (await hasRole(req, permissionLevels.writer))
        return res.status(400).json({
            message: "You do not have permission to perform this action.",
        });
    // TODO: use express-validator
    if (isValidPost(req.body)) {
        req.body.createdAt = new Date();
        req.body.author = req.user.username;
        Post.update(
            { title: req.body.title },
            { $setOnInsert: req.body },
            { upsert: true },
        )
            .then(() => res.status(201).json({ message: "Post added" }))
            .catch((err) => res.status(500).json({ message: err.toString() }));
    } else {
        res.status(400).json({ message: "Invalid post details" });
    }
});

export const isValidPost = (json: any) => {
    // Verifying that the post info is entered properly
    return json.title && json.title != "" && json.content && json.content != "";
};

export const blogRouter = router;
