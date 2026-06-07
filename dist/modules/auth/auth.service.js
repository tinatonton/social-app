"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../../db/user.model");
const user_repo_1 = require("../../db/repositories/user.repo");
const error_response_1 = require("../../utils/response/error.response");
const hash_1 = require("../../utils/security/hash");
const encryption_1 = require("../../utils/security/encryption");
const generateOTP_1 = require("../../utils/security/generateOTP");
const email_events_1 = require("../../utils/events/email.events");
class AuthenticationService {
    _userModel = new user_repo_1.userRepository(user_model_1.userModel);
    constructor() { }
    signup = async (req, res) => {
        const { username, email, password, phone } = req.body;
        const checkUser = await this._userModel.findOne({
            filter: { email },
            select: "email"
        });
        if (checkUser)
            throw new error_response_1.ConflictRequestException("user Already exists");
        const otp = (0, generateOTP_1.generateOtp)();
        const user = await this._userModel.create({
            data: [{ username,
                    email,
                    password: await (0, hash_1.generateHash)(password),
                    phone: await (0, encryption_1.encrypt)(phone),
                    confirmEmailOtp: await (0, hash_1.generateHash)(otp.toString())
                }],
            options: { validateBeforeSave: true }
        });
        await email_events_1.emailEvents.emit("confirmEmail", { to: email, username, otp });
        return res.status(201).json({ message: "user created successfully", data: { user } });
    };
    confirmEmail = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this._userModel.findOne({
            filter: { email, confirmEmailOtp: { $exists: true }, confirmEmail: { $exists: false } },
        });
        if (!user)
            throw new error_response_1.NotFoundException("user not found or already confirmed");
        if (!(0, hash_1.compareHash)(otp, user?.confirmEmailOtp))
            throw new error_response_1.BadRequestException("invalid otp");
        await this._userModel.updateOne({
            filter: { email },
            update: {
                confirmEmail: new Date(),
                $unset: { confirmEmailOtp: true }
            },
            options: null,
        });
        return res.status(200).json({ message: "user confirmed successfully", data: { user } });
    };
}
exports.default = new AuthenticationService();
