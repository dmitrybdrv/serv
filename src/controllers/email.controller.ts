import {NextFunction, Request, Response} from "express";
import EmailService from "../service/mailService";

const EmailController = {

    addUserToBlackList: async (req: Request, res: Response, next: NextFunction) => {

        try {

            const {email} = req.body
            const emailData = await EmailService.addUserToBlackList(email)
            return res.json(emailData)

        } catch (e) {
            next(e)
        }
    },

}

export default EmailController