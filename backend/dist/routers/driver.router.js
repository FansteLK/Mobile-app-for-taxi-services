"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const driver_controler_1 = require("../controllers/driver.controler");
const driverRouter = express_1.default.Router();
driverRouter.route('/changeActivity').post((req, res) => new driver_controler_1.DriverControler().changeActivity(req, res));
driverRouter.route('/inRange').get((req, res) => new driver_controler_1.DriverControler().inRange(req, res));
driverRouter.route('/acceptRide').post((req, res) => new driver_controler_1.DriverControler().acceptRide(req, res));
driverRouter.route('/getRideWaitingDuration').get((req, res) => new driver_controler_1.DriverControler().getRideWaitingDuration(req, res));
driverRouter.route('/getMaxDistance').get((req, res) => {
    new driver_controler_1.DriverControler().getMaxDistance(req, res);
});
driverRouter.route('/getLocationRefreshTime').get((req, res) => {
    new driver_controler_1.DriverControler().getLocationRefreshTime(req, res);
});
driverRouter.route('/sendDriverLocation').post((req, res) => {
    new driver_controler_1.DriverControler().receiveDriverLocation(req, res);
});
driverRouter.route('/getActiveRide').get((req, res) => {
    new driver_controler_1.DriverControler().getActiveDrive(req, res);
});
driverRouter.route('/setUserIrregular').post((req, res) => {
    new driver_controler_1.DriverControler().setUserIrregular(req, res);
});
driverRouter.route('/rideFinished').get((req, res) => {
    new driver_controler_1.DriverControler().rideFinished(req, res);
});
driverRouter.route('/getTodayStatistic').get((req, res) => {
    new driver_controler_1.DriverControler().getTodayStatistic(req, res);
});
driverRouter.route('/getStatistic').get((req, res) => {
    new driver_controler_1.DriverControler().getStatistic(req, res);
});
driverRouter.route('/getMonthStatistic').get((req, res) => {
    new driver_controler_1.DriverControler().getMonthStatistic(req, res);
});
exports.default = driverRouter;
//# sourceMappingURL=driver.router.js.map