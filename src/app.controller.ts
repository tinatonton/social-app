
import express, { Express, NextFunction ,Request,Response} from "express";

import cors from "cors";
import helmet from "helmet";
import { customRateLimiter } from "./utils/ratelimiter/ratelimit";
import { authRouter, postRouter, commentsRouter, userRouter } from "./modules";
import { globalErrorHandler, NotFoundException } from "./utils/response/error.response";
import { corsOptions } from "./utils/cors/cors.utils";
import { PORT } from "./config/config.service";
import connectDB from "./db/connection";
import { redisConnection } from "./db/redis.connection";
import { userModel, userSchema } from "./db/user.model";
import { userRepository } from "./db/repositories/user.repo";



export const bootstrap = async () => { 
const app: Express = express();
app.use(express.json(),cors(corsOptions),helmet(),customRateLimiter);

app.get("/", (req:Request, res:Response, next:NextFunction) => {
    return res .status(200) .json({ message: "Hello, World!" });
});
await connectDB()
await redisConnection()
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/users", userRouter);
const userRepo=new userRepository(userModel)
const user= await userRepo.insertMany({data:[{
    username:"tina gerges",
    email:`${Date.now()}@gmail.com`,
    password:"tina@12345",
    phone:"0125454544"

}]})
app.use(globalErrorHandler);

app.use("/*dummy", (req:Request, res:Response, next:NextFunction) => {
    throw new NotFoundException("Route not found");
});
app .listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

}