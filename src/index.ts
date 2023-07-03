import express, {Request, Response} from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import handlebars from 'handlebars'
import * as mongoose from "mongoose";
import EmailSchema from './model/emailModel'

dotenv.config()

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const DBUrl = process.env.DB_HOST || ''
const UNSUBSCRIBE_URL = process.env.UNSUBSCRIBE_URL

const filePath = path.join(__dirname, '..', 'src/common/template.html')
const fileContent = fs.readFileSync(filePath, 'utf8')
const template = handlebars.compile(fileContent)

/**
 * Запрос на отправку письма
 */
app.post('/send-email', async (req: Request, res: Response) => {
    try {
        debugger
        //объект с входящими данными на сервер
        const {email, name} = req.body

        //инициализация emailId для привязки к URL (в механизме отписки), newEmail - создание нового адреса если нет в базе
        let emailId, newEmail;

        //проверка на наличие в базе
        const foundEmail = await EmailSchema.findOne({email})

        if (!foundEmail) {
            //добавление в базу нового пользователя (адрес эл.почты)
            newEmail = new EmailSchema({email, name, blockList: false});
            await newEmail.save();

        } else {
            if (foundEmail.blockList) {
                //если свойство blockList, тогда почта заблокирована
                res.status(400).send({error: 'Почта заблокирована!'})
                return
            }
        }

        //Создание id при новой регистраци либо достаём _id ранее созданный, если запись уже была в базе
        emailId = foundEmail?._id ? foundEmail._id.toString() : newEmail?._id.toString()

        //валидация почты
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

        //проверка валидности почты
        if (!emailRegex.test(email)) {
            res.status(400).send({error: 'Неверный адрес электронной почты!'})
            return;
        }

        //валидация имени
        const nameRegex = /^[a-zA-Zа-яА-ЯёЁ ]{1,20}$/
        if (name && !nameRegex.test(name)) {
            res.status(400).send({error: 'Неверное имя!'})
            return;
        }

        //передача данных в файл common/template.html для настройки отправляемого письма
        const html = template({name, emailId, UNSUBSCRIBE_URL})

        //настройка транспорта
        const transporter = nodemailer.createTransport({
            host: 'smtp.yandex.ru',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        })

        //настройка почтового отправления
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Прайс',
            html: html,
            attachments: [{
                filename: 'price.xlsx',
                path: path.join(__dirname, '..', 'src/common/price.xlsx'),
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }]
        }

        //ответ на запрос /send-email
        await transporter.sendMail(mailOptions)

        //возврат положительного отвтета
        res.status(200).send({message: 'Прайс отправлен на почту!'})

    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'Что-то пошло не так, попробуйте ещё раз'});
    }
})

/**
 * Добавление почтового адреса в блок лист (отписка от рассылки)
 */
app.post('/unsubscribe-page/:id', async (req: Request, res: Response) => {
    try {
        const {emailId} = req.body
        const foundEmailId = await EmailSchema.findOne({emailId})
        if (foundEmailId) {
            foundEmailId.blockList = true;
            await foundEmailId.save();
        }
        res.status(200).send({message: 'Вы отписались!'})
    } catch (error) {
        console.error(error);
        res.status(500).send({error: 'Что-то пошло не так, попробуйте ещё раз'});
    } finally {
        // закрытие соединения с базой данных
        await mongoose.connection.close();
    }
})

/**
 * Подключение к базе данных
 */
const start = async () => {
    try {
        await mongoose.connect(DBUrl, {
            //@ts-ignore
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`));
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}
start()
