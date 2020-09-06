import { Request, Response, NextFunction } from "express";
import {
    Project,
    stripCredentials,
    User,
    permissionLevels,
    loggedIn,
    Post,
    hasRole,
} from "../config";
import passport from "passport";
import { body, validationResult } from "express-validator";

export default [
    {
        methods: {
            get: [
                {
                    data: { message: "Hello, world! This is an api." },
                },
                // Error Handler
            ],
        },
        children: [
            {
                path: "projects",
                methods: {
                    get: async (req: Request, res: Response) => {
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
                    },
                },
            },
            {
                path: "auth",
                children: [
                    {
                        path: "profile",
                        methods: {
                            get: [
                                loggedIn,
                                async (req: Request, res: Response) => {
                                    res.json({
                                        user: stripCredentials(req.user),
                                    });
                                },
                            ],
                        },
                    },
                    {
                        path: "logout",
                        methods: {
                            get: async (req: Request, res: Response) => {
                                req.logOut();
                                res.json({
                                    message: "Logged out successfully.",
                                });
                            },
                        },
                    },
                    {
                        path: "login",
                        methods: {
                            post: async (
                                req: Request,
                                res: Response,
                                next: NextFunction,
                            ) => {
                                passport.authenticate(
                                    "local",
                                    (error, user) => {
                                        if (error)
                                            return res
                                                .status(400)
                                                .json({ error });
                                        req.logIn(user, function (err) {
                                            if (err)
                                                return res.status(401).json({
                                                    message:
                                                        "Invalid credentials",
                                                });

                                            // If this function gets called, authentication was successful.
                                            // `req.user` contains the authenticated user.
                                            res.json({
                                                user: stripCredentials(
                                                    req.user,
                                                ),
                                            });
                                        });
                                    },
                                )(req, res, next);
                            },
                        },
                    },
                    {
                        path: "register",
                        methods: {
                            post: [
                                [
                                    // username must be an email
                                    body("username").isEmail().notEmpty(),
                                    body("password").notEmpty(),
                                ],
                                async (req: Request, res: Response) => {
                                    // Finds the validation errors in this request and wraps them in an object with handy functions
                                    const errors = validationResult(req);
                                    if (!errors.isEmpty()) {
                                        return res
                                            .status(422)
                                            .json({ errors: errors.array() });
                                    }
                                    try {
                                        const user = await User.register(
                                            new User({
                                                ...req.body,
                                                providers: [],
                                                roles: [permissionLevels.user],
                                            }),
                                            req.body.password,
                                        );
                                        res.json({
                                            user: stripCredentials(user),
                                        });
                                    } catch (err) {
                                        res.status(500).json({
                                            message: err.toString(),
                                        });
                                    }
                                },
                            ],
                        },
                    },
                ],
            },
            {
                path: "blog",
                children: [
                    {
                        path: "posts",
                        methods: {
                            get: async (req: Request, res: Response) => {
                                let posts = await Post.find({});
                                if (req.query.search)
                                    posts = posts.filter(
                                        (p) =>
                                            p.get("title") != "" &&
                                            p
                                                .get("title")
                                                .toLowerCase()
                                                .includes(
                                                    req.query.search as string,
                                                ),
                                    );
                                if (req.query.date)
                                    posts = posts.filter((p) => {
                                        return (
                                            p.get("createdAt").toString() ===
                                            (req.query.date as string)
                                        );
                                    });
                                if (req.query.category)
                                    posts = posts.filter((p) => {
                                        return (
                                            p.get("category").toString() ===
                                            (req.query.category as string)
                                        );
                                    });
                                res.json(posts);
                            },
                        },
                    },
                    {
                        path: "post/:id",
                        methods: {
                            get: async (req: Request, res: Response) => {
                                const post = await Post.findOne({
                                    _id: req.params.id || "",
                                });
                                res.json(post);
                            },
                        },
                    },
                    {
                        path: "post",
                        methods: {
                            delete: async (req: Request, res: Response) => {
                                if (
                                    !(await hasRole(
                                        req,
                                        permissionLevels.writer,
                                    ))
                                )
                                    return res.status(400).json({
                                        message:
                                            "You do not have permission to perform this action.",
                                    });

                                const result = await Post.remove(req.body);
                                res.json(result);
                            },
                            post: [
                                loggedIn,
                                [
                                    body("title").notEmpty(),
                                    body("description").notEmpty(),
                                    body("content").notEmpty(),
                                ],
                                async (req: Request, res: Response) => {
                                    if (
                                        !(await hasRole(
                                            req,
                                            permissionLevels.writer,
                                        ))
                                    )
                                        return res.status(400).json({
                                            message:
                                                "You do not have permission to perform this action.",
                                        });
                                    // TODO: use express-validator
                                    const errors = validationResult(req);
                                    if (!errors.isEmpty()) {
                                        return res.status(422).json({
                                            errors: errors.array(),
                                            message: "Invalid post details.",
                                        });
                                    }
                                    req.body.createdAt = new Date().getTime();
                                    req.body.author = req.user.name;
                                    if (!req.body.category)
                                        req.body.category = "Uncategorized";
                                    Post.updateOne(
                                        { title: req.body.title },
                                        req.body,
                                        {
                                            upsert: true,
                                        },
                                    )
                                        .then(async (result) =>
                                            res.status(201).json({
                                                message:
                                                    "Post created or updated",
                                                result,
                                            }),
                                        )
                                        .catch((err) =>
                                            res.status(500).json({
                                                message: err.toString(),
                                            }),
                                        );
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
    {
        path: "*",
        methods: {
            all: {
                data: "<h1>404</h1><h2>Requested Resource Not Found</h2>",
                status: 404,
            },
        },
    },
];
