import { Request, Response } from 'express';
import { confirmEmailDTO, signUpDTO } from './auth.dto';
import { HUserDocument, IUser, userModel } from '../../db/user.model';
import { userRepository } from '../../db/repositories/user.repo';
import { BadRequestException, ConflictRequestException, NotFoundException } from '../../utils/response/error.response';
import { compareHash, generateHash } from '../../utils/security/hash';
import { encrypt } from '../../utils/security/encryption';
import { generateOtp } from '../../utils/security/generateOTP';
import { emailEvents } from '../../utils/events/email.events';





class AuthenticationService {
    private _userModel= new userRepository(userModel)
    constructor() {}

    signup = async (req: Request, res: Response): Promise<Response> => {
        const {username, email, password,phone} = req.body as signUpDTO;
const checkUser= await this._userModel.findOne({
    filter:{email},
    select:"email"
});
if(checkUser)throw new ConflictRequestException("user Already exists")
const otp = generateOtp()




    const user =await this ._userModel.create({
data:[{username,
    email,
    password: await generateHash(password),
    phone:await encrypt(phone),
    confirmEmailOtp:await generateHash(otp.toString())
}],
options:{validateBeforeSave:true}
})

await emailEvents.emit("confirmEmail",{to:email,username,otp})
        return res.status(201).json({ message: "user created successfully",data:{user} });
    };

        confirmEmail = async (req: Request, res: Response): Promise<Response> => {
        const { email, otp} = req.body as confirmEmailDTO;
const user = await this._userModel.findOne({
    filter:{email,confirmEmailOtp:{$exists:true},confirmEmail:{$exists:false}},
})
if(!user) throw new NotFoundException("user not found or already confirmed")
    if(!compareHash(otp,user?.confirmEmailOtp as string))
        throw new BadRequestException("invalid otp")
    await this._userModel.updateOne({
          filter:{email},
        update:{
            confirmEmail:new Date(),
            $unset:{confirmEmailOtp:true}
        },
        options: null,
    })

    
        return res.status(200).json({ message: "user confirmed successfully",data:{user} });
    };

    
}
    



export default new AuthenticationService();
