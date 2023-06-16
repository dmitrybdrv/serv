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
    try {
        //объект с входящими данными на сервер
        const {email, name, termsOfService} = req.body
        //валидация почты
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        //проверка на валидность почты
        if (!emailRegex.test(email)) {
            res.status(400).send({ error: 'Неверный адрес электронной почты!' });
            return;
        }
        //валидация имени
        const nameRegex = /^[a-zA-Zа-яА-ЯёЁ ]{1,20}$/
        if (!nameRegex.test(name)) {
            res.status(400).send({ error: 'Неверное имя!' });
            return;
        }
        //передача данных в файл common/template.html для настройки отправляемого письма
        const html = template({ name, email });
        //настройка транспорта
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
        //возврат положительного отвтета
        res.status(200).send({message: 'Прайс отправлен на Ваш почтовый ящик!'})
    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'что-то пошло не так, попробуйте ещё раз'});
    }
})


app.listen(PORT, () => {
    console.log(`Successfully ${PORT}`)
})