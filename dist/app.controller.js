"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const ratelimit_1 = require("./utils/ratelimiter/ratelimit");
const modules_1 = require("./modules");
const error_response_1 = require("./utils/response/error.response");
const cors_utils_1 = require("./utils/cors/cors.utils");
const config_service_1 = require("./config/config.service");
const connection_1 = __importDefault(require("./db/connection"));
const redis_connection_1 = require("./db/redis.connection");
const user_model_1 = require("./db/user.model");
const user_repo_1 = require("./db/repositories/user.repo");
const bootstrap = async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json(), (0, cors_1.default)(cors_utils_1.corsOptions), (0, helmet_1.default)(), ratelimit_1.customRateLimiter);
    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "Hello, World!" });
    });
    await (0, connection_1.default)();
    await (0, redis_connection_1.redisConnection)();
    app.use("/api/auth", modules_1.authRouter);
    app.use("/api/posts", modules_1.postRouter);
    app.use("/api/comments", modules_1.commentsRouter);
    app.use("/api/users", modules_1.userRouter);
    const userRepo = new user_repo_1.userRepository(user_model_1.userModel);
    const user = await userRepo.insertMany({ data: [{
                username: "tina gerges",
                email: `${Date.now()}@gmail.com`,
                password: "tina@12345",
                phone: "0125454544"
            }] });
    app.use(error_response_1.globalErrorHandler);
    app.use("/*dummy", (req, res, next) => {
        throw new error_response_1.NotFoundException("Route not found");
    });
    app.listen(config_service_1.PORT, () => {
        console.log(`Server is running on port ${config_service_1.PORT}`);
    });
};
exports.bootstrap = bootstrap;
