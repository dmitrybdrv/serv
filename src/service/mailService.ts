import EmailSchema from '../model/emailModel'


const EmailService = {
    addUserToBlackList:  async (email: string) => {
        return await EmailSchema.create({email})
    }
 }

 export default EmailService