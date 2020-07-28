import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User, permissionLevels, loggedIn, stripCredentials } from "../config";
import { getGoogleAccountFromCode } from "../google-util";
import { PassportLocalDocument } from "mongoose";
import passport from "passport";

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

                req.user = existing;
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
                    req.user = user;
                    req.session.save(() => {
                        res.redirect("/dashboard");
                    });
                } else {
                    req.user = null;
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
    res.json(stripCredentials(req.user));
});

// Registration
router.post(
    "/user/create",
    [
        // username must be an email
        body("username").isEmail().notEmpty(),
        body("password").notEmpty(),
    ],
    async (req: Request, res: Response) => {
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
            res.json(user);
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
router.post("/user", async (req, res, next) => {
    passport.authenticate("local", (err, user) => {
        if (err) return next(err);
        if (!user) return res.status(404).json({ message: "User not found" });
        req.logIn(user, function (err) {
            if (err)
                return res.status(401).json({ message: "Invalid credentials" });

            // If this function gets called, authentication was successful.
            // `req.user` contains the authenticated user.
            res.json({ user: stripCredentials(req.user) });
        });
    })(req, res, next);
});

export const authRouter = router;
