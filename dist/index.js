"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const mongoose = __importStar(require("mongoose"));
const emailModel_1 = __importDefault(require("./model/emailModel"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const DBUrl = process.env.DB_HOST || '';
const UNSUBSCRIBE_URL = process.env.UNSUBSCRIBE_URL;
const filePath = path_1.default.join(__dirname, '..', 'src/common/template.html');
const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
const template = handlebars_1.default.compile(fileContent);
/**
 * Тестовый запрос для проверки работы сервера. (vercel)
 */
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).send('Hello world!');
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: 'Сервер не отвечает!' });
    }
}));
/**
 * Запрос на отправку письма
 */
app.post('/send-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //объект с входящими данными на сервер
        const { email, name } = req.body;
        //инициализация emailId для привязки к URL (в механизме отписки), newEmail - создание нового адреса если нет в базе
        let emailId, newEmail;
        //проверка на наличие в базе
        const foundEmail = yield emailModel_1.default.findOne({ email });
        if (!foundEmail) {
            //добавление в базу нового пользователя (адрес эл.почты)
            newEmail = new emailModel_1.default({ email, name, blockList: false });
            yield newEmail.save();
        }
        else {
            if (foundEmail.blockList) {
                //если свойство blockList, тогда почта заблокирована
                res.status(400).send({ error: 'Почта заблокирована!' });
                return;
            }
        }
        //Создание id при новой регистраци либо достаём _id ранее созданный, если запись уже была в базе
        emailId = (foundEmail === null || foundEmail === void 0 ? void 0 : foundEmail._id) ? foundEmail._id.toString() : newEmail === null || newEmail === void 0 ? void 0 : newEmail._id.toString();
        //валидация почты
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        //проверка валидности почты
        if (!emailRegex.test(email)) {
            res.status(400).send({ error: 'Неверный адрес электронной почты!' });
            return;
        }
        //валидация имени
        const nameRegex = /^[a-zA-Zа-яА-ЯёЁ ]{1,20}$/;
        if (name && !nameRegex.test(name)) {
            res.status(400).send({ error: 'Неверное имя!' });
            return;
        }
        //передача данных в файл common/template.html для настройки отправляемого письма
        const html = template({ name, emailId, UNSUBSCRIBE_URL });
        //настройка транспорта
        const transporter = nodemailer_1.default.createTransport({
            host: 'smtp.yandex.ru',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });
        //настройка почтового отправления
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Прайс',
            html: html,
            attachments: [
                {
                    filename: 'gillettePrice.xlsx',
                    path: path_1.default.join(__dirname, '..', 'src/common/gillettePrice.xlsx'),
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
                {
                    filename: 'orderForm.xlsx',
                    path: path_1.default.join(__dirname, '..', 'src/common/orderForm.xlsx'),
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
                {
                    filename: 'instruction.docx',
                    path: path_1.default.join(__dirname, '..', 'src/common/instruction.docx'),
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                },
            ]
        };
        //ответ на запрос /send-email
        yield transporter.sendMail(mailOptions);
        //возврат положительного отвтета
        res.status(200).send({ message: 'Прайс отправлен на почту!' });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Что-то пошло не так, попробуйте ещё раз' });
    }
}));
/**
 * Добавление почтового адреса в блок лист (отписка от рассылки)
 */
app.post('/unsubscribe-page/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { emailId } = req.body;
        const foundEmailId = yield emailModel_1.default.findOne({ emailId });
        if (foundEmailId) {
            foundEmailId.blockList = true;
            yield foundEmailId.save();
        }
        res.status(200).send({ message: 'Вы отписались!' });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Что-то пошло не так, попробуйте ещё раз' });
    }
    finally {
        // закрытие соединения с базой данных
        yield mongoose.connection.close();
    }
}));
/**
 * Подключение к базе данных
 */
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose.connect(DBUrl, {
            //@ts-ignore
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`));
    }
    catch (e) {
        console.log(e);
        process.exit(1);
    }
});
start();
