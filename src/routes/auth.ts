import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import {
    User,
    permissionLevels,
    loggedIn,
} from "../config";
import { getGoogleAccountFromCode } from "../google-util";
import { PassportLocalDocument } from "mongoose";

const router = express.Router();
/* router.get("/google", async (req, res) => {
    const code = decodeURIComponent(req.query.code.toString());
    console.log(code);
    if (code) {
        const google = await getGoogleAccountFromCode(code);
        if (google && google.email) {
            const existing = await User.findOne({ email: google.email });
            if (existing) {
                if (existing.get("provider") != "google") {
                    existing.set("provider", "google");
                }
                existing.set("picture", google.picture);
                existing.set("name", google.name);
                await existing.save();

                req.session.user = existing;
                req.session.google = google;
                req.session.save(() => {
                    res.redirect("/dashboard");
                });
            } else {
                const user = await User.create({
                    email: google.email,
                    provider: "google",
                    picture: google.picture,
                });
                if (user) {
                    req.session.user = user;
                    req.session.save(() => {
                        res.redirect("/dashboard");
                    });
                } else {
                    req.session.user = null;
                    req.session.save(() => {
                        res.redirect("/dashboard");
                    });
                }
            }
        }
    } else {
        res.redirect("/");
    }
}); */

// User Profile
router.post("/profile", loggedIn, async (req: Request, res: Response) => {
    res.json({ username: req.user.username, picture: req.user.picture });
});

// Registration
router.post(
    "/user/create",
    [
        // username must be an email
        body("username").isEmail().notEmpty(),
        // password must be at least 5 chars long
        body("password").isLength({ min: 5 }).notEmpty(),
    ],
    async (req, res) => {
        // Finds the validation errors in this request and wraps them in an object with handy functions
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
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
            User.authenticate()(req, res, () => {
                res.json(user);
            });
        } catch (err) {
            res.status(500).json({ message: err.toString() });
        }
    },
);

router.get("/logout", (req, res) => {
    req.logOut();
    res.json({ message: "Logged out successfully." });
});

// Login
router.post(
    "/user",
    [body("username").isEmail().notEmpty(), body("password").notEmpty()],
    async (req: Request, res: Response) => {
        try {
            // Finds the validation errors in this request and wraps them in an object with handy functions
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({ errors: errors.array() });
            }

            const user = await User.findOne({
                username: req.body.username,
            }).exec();

            if (user === null)
                res.status(404).json({ message: "User not found" });

            const success = !(await (
                await (user as PassportLocalDocument).authenticate(
                    req.body.password,
                )
            ).error);
            if (success) {
                const token = jwt.sign({ user }, "12 34", {
                    expiresIn: 3600, // 1week  604800
                });
                // TODO: strip password from user response
                res.status(200).json({
                    success: true,
                    token,
                    user,
                });
            }
        } catch (err) {
            res.status(401).json({
                message: "Invalid credentials",
                errors: err,
            });
        }
    },
);

export const authRouter = router;
