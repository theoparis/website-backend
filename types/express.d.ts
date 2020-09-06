import { Request as ExpressRequest } from "../src/old_routes/node_modules/express";

declare module "express" {
    interface Request {
        user?: any;
    }
}
