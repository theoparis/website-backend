import Stripe from "stripe";
import mongoose, { Schema, PassportLocalSchema } from "mongoose";
import dotenv from "dotenv";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { PassportStatic, authenticate } from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Request, Response, NextFunction } from "express";

const result = dotenv.config();
if (result.error) {
    console.log(`Failed to parse .env file`);
} else {
    process.env = result.parsed || process.env;
}

export const dbUrl =
    process.env.MONGO_URI || "mongodb://localhost:27017/website";
export const permissionLevels = {
    user: "user",
    writer: "writer",
    admin: "admin",
};
export const saltRounds = 10;
mongoose.connect(
    dbUrl,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err) => {
        if (err) throw err;
    },
);

const UserSchema = new Schema({
    name: { type: String, required: false },
    username: { type: String, required: true },
    providers: { type: Array, required: true },
    roles: { type: Array, required: true },
    picture: { type: String, required: false },
});

UserSchema.plugin(passportLocalMongoose);

const PostSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Number, required: true },
    author: { type: String, required: true },
    category: { type: String, required: false },
    description: { type: String, required: true },
});

const ProjectSchema = new Schema({
    url: { type: String, required: false },
    codeUrl: { type: String, required: false },
    name: { type: String, required: true },
    description: { type: String, required: true },
});

export const User = mongoose.model("User", UserSchema as PassportLocalSchema);
export const Post = mongoose.model("Post", PostSchema);
export const Project = mongoose.model("Project", ProjectSchema);

export async function loggedIn(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (req.isAuthenticated()) {
        req.session.isAuthenticated = true;
        return next();
    } else return res.status(401).json({ message: "Not logged in" });
}

export const stripCredentials = (user: any) => ({
    username: user.username,
    name: user.name,
    roles: user.roles,
    providers: user.providers,
    _id: user._id,
});

/**
 * Retrieves the user from the database using the username from the request's session.
 */
export async function getSessionUser(req: Request) {
    return await User.findById(req.user._id);
}

/**
 * Assumes the user is already logged in and their session is valid
 */
export const hasRole = async (req: Request, role): Promise<boolean> => {
    const user = await getSessionUser(req);
    if (!user) return false;
    return user.get("roles").includes(role);
};

export const initializePassport = (passport: PassportStatic) => {
    // use static authenticate method of model in LocalStrategy
    passport.use(User.createStrategy());

    // use static serialize and deserialize of model for passport session support
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
};

/* // TODO; make this optional
export const stripe = new Stripe(process.env.stripeKey, { apiVersion: '2020-03-02' })

export const getProducts = async () => {
  const products = await stripe.products.list({ limit: 100 })
  const productList = []
  for(const [index, p] of products.data.entries()){
    const product = {
      ...p,
      skus: (await stripe.skus.list({ product: p.id })).data,
    }
    productList.push(product)
  }
  return productList
}
 */
