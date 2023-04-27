"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controler_1 = require("../controllers/user.controler");
const userRouter = express_1.default.Router();
userRouter.route('/login').post((req, res) => new user_controler_1.UserController().login(req, res));
userRouter.route('/register').post((req, res) => {
    new user_controler_1.UserController().register(req, res);
});
userRouter.route('/requestPrice').get((req, res) => new user_controler_1.UserController().requestPrice(req, res));
userRouter.route('/userRideResponse').get((req, res) => {
    new user_controler_1.UserController().userRideResponse(req, res);
});
userRouter.route('/getActiveRide').get((req, res) => {
    new user_controler_1.UserController().getActiveDrive(req, res);
});
userRouter.route('/getRides').get((req, res) => {
    new user_controler_1.UserController().getRides(req, res);
});
exports.default = userRouter;
//# sourceMappingURL=user.router.js.map