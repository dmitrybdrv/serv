import express, {Request, Response} from 'express'
import nodemailer from 'nodemailer';
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

dotenv.config()

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
    res.status(200).send(`Server successful started ${process.env.EMAIL}`)
})

const filePath = path.join(__dirname, '..', 'src/common/template.html')
const fileContent = fs.readFileSync(filePath, 'utf8')
const template = handlebars.compile(fileContent);

app.post('/send-email', async (req: Request, res: Response) => {
    const {email, name, termsOfService} = req.body
    const html = template({ name, email });
    const transporter = nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    })
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Прайс',
        html: html,
        //text: `${name ? 'Здравствуйте, ' + name : 'Здравствуйте!'}`,
        attachments: [{
            filename: 'price.xlsx',
            path: path.join(__dirname, '..', 'src/common/price.xlsx'),
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }]
    }
    await transporter.sendMail(mailOptions)
    res.status(200).send('Проверьте свой почтовый ящик!')
})


app.listen(PORT, () => {
    console.log(`Successfully ${PORT}`)
})