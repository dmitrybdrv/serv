import EmailController from "../controllers/email.controller";

const Router = require('express').Router;

const router = new Router();

router.post('/add-to-list', EmailController.addUserToBlackList);

export default router