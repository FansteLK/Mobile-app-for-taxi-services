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
exports.UserController = void 0;
const users_1 = __importDefault(require("../models/users"));
const tariffs_1 = __importDefault(require("../models/tariffs"));
const rides_1 = __importDefault(require("../models/rides"));
const value_1 = __importDefault(require("../models/value"));
const bcrypt = __importStar(require("bcryptjs"));
const axios = require('axios');
class UserController {
    constructor() {
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let email = req.body.email;
            let password = req.body.password;
            const user = yield users_1.default.findOne({ 'email': email }).catch(err => {
                console.log(err);
            });
            if (user) {
                const validPassword = yield bcrypt.compare(password, user.password);
                if (validPassword) {
                    if (user.regular)
                        res.status(200).json(user);
                    else {
                        res.status(400).json({ error: "User isnt regular" });
                    }
                }
                else {
                    res.status(400).json({ error: "Invalid Password" });
                }
            }
            else {
                res.status(401).json({ error: "User does not exist" });
            }
        });
        this.register = (req, res) => __awaiter(this, void 0, void 0, function* () {
            let email = req.body.email;
            let password = req.body.password;
            let number = req.body.number;
            const salt = yield bcrypt.genSaltSync(10);
            password = yield bcrypt.hashSync(password, salt);
            let userAdd = new users_1.default({
                email: email,
                password: password,
                number: number,
                type: "user",
                availability: null,
                regular: true
            });
            users_1.default.findOne({ 'email': req.body.email }, (err, user) => {
                if (err) {
                    console.log(err);
                    return;
                }
                if (user) {
                    res.status(400).json({ 'message': 'The email is already linked to another account' });
                }
                else {
                    users_1.default.findOne({ 'number': number }, (err, user2) => {
                        if (user2) {
                            res.status(400).json({ 'message': 'The number is already linked to another account' });
                        }
                        else {
                            userAdd.save().then(user => {
                                res.status(200).json({ 'message': 'user added' });
                            }).catch(err => {
                                res.status(400).json({ 'message': 'error' });
                            });
                        }
                    });
                }
            });
        });
        this.requestPrice = (req, res) => {
            let user_email = req.query.user_email;
            let origin = req.query.origin;
            let destination = req.query.destination;
            let distance = Number(req.query.distance) / 1000;
            let duration = Number(req.query.duration);
            let traffick_duration = Number(req.query.traffic_duration);
            let traffick_coeficient = 1;
            if (traffick_duration > duration) {
                traffick_coeficient = ((traffick_duration / duration) - 1) / 2 + 1;
            }
            rides_1.default.deleteMany({ 'user_email': user_email, 'status': '' }, (err, rides) => {
            });
            let night = isNight();
            let weekend = isWeekend();
            let holiday = false;
            //let holidat= isHoliday();
            tariffs_1.default.findOne({ $and: [{ 'night': night }, { 'weekend': weekend }, { 'holiday': holiday }] }, (err, tariff) => {
                if (err) {
                    console.log(err);
                }
                else {
                    let price = tariff.starting_price;
                    price += tariff.price_per_km * (distance - 1) * traffick_coeficient;
                    price = price.toFixed(2);
                    rides_1.default.findOne({ $and: [{ $or: [{ 'status': 'scheduled' }, { 'status': 'accepted' }] }, { 'user_email': user_email }] }, (err, ride) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            if (ride) {
                                res.status(400).json({ 'message': 'You already have a drive scheduled' });
                            }
                            else {
                                users_1.default.findOne({ 'email': user_email, 'regular': true }, (err, user) => {
                                    if (err)
                                        console.log(err);
                                    if (user) {
                                        let ride = new rides_1.default({
                                            user_email: user_email,
                                            origin: origin,
                                            destination: destination,
                                            estimated_price: price,
                                            estimated_duration: traffick_duration,
                                            status: '',
                                            distance: distance,
                                            user_waiting_time: null,
                                            driver: null,
                                            user_token: null,
                                            taxiOrigin: null,
                                            date: formatDate(new Date())
                                        });
                                        ride.save().then(ride => {
                                            res.status(200).json({ 'price': price });
                                        }).catch(err => {
                                            res.status(400).json({ 'message': 'error' });
                                        });
                                    }
                                    else {
                                        res.status(400).json({ 'message': 'User isnt regular' });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        };
        this.userRideResponse = (req, res) => {
            let isAccepted = req.query.response;
            let email = req.query.email;
            let token = req.query.token;
            if (isAccepted === "true") {
                rides_1.default.findOneAndUpdate({ 'user-email': email, 'status': '' }, { $set: { 'user_token': token, 'status': 'scheduled' } }, (err, ride) => {
                    if (ride) {
                        users_1.default.findOne({ 'email': email, 'regular': true }, (err, user) => {
                            if (err)
                                console.log(err);
                            if (user) {
                                let uri = 'https://us-central1-taxiapp-54da0.cloudfunctions.net/sendDriverDistanceRequest?address=' + ride.origin + "&user=" + ride.user_email + "&dstAddress=" + ride.destination;
                                let encoded = encodeURI(uri);
                                axios.get(encoded)
                                    .then(res => {
                                })
                                    .catch(error => {
                                    console.error(error);
                                });
                                res.status(200).json({ 'message': 'uspesno' });
                            }
                            else {
                                res.status(400).json({ 'message': 'User isnt regular' });
                            }
                        });
                    }
                });
                value_1.default.findOne({ 'name': 'request_waiting_duration' }, (err, value) => {
                    if (err)
                        console.log(err);
                    else {
                        if (value) {
                            let n;
                            n = setTimeout(function () {
                                rides_1.default.findOneAndUpdate({ 'user-email': email, 'status': 'scheduled' }, { $set: { 'status': 'canceled' } }, (err, ride) => {
                                    if (ride) {
                                        axios.get('https://us-central1-taxiapp-54da0.cloudfunctions.net/sendNoRide?token=' + token).then(res => {
                                        }).catch(err => {
                                            console.error(err);
                                        });
                                    }
                                });
                            }, value.value * 1000);
                        }
                    }
                });
            }
            else {
                rides_1.default.findOneAndDelete({ 'user_email': email, 'status': 'scheduled' }).then(() => {
                    res.status(400).json({ 'message': 'declined' });
                    // res.status(200).json({'message':'uspesno'})
                }).catch((err) => {
                    console.log(err);
                    res.status(400).json({ 'message': 'neuspesno' });
                });
            }
        };
        this.getActiveDrive = (req, res) => {
            let email = req.query.email;
            rides_1.default.findOne({ $and: [{ $or: [{ 'status': 'scheduled' }, { 'status': 'accepted' }] }, { 'user_email': email }] }, (err, ride) => {
                if (err)
                    console.log(err);
                if (ride) {
                    if (ride.status == 'scheduled') {
                        res.status(200).json({ 'status': ride.status });
                    }
                    else {
                        users_1.default.findOne({ 'email': ride.driver }, (err, driver) => {
                            if (err)
                                console.log(err);
                            else {
                                res.status(200).json({ 'status': ride.status, 'taxiOrigin': ride.taxiOrigin, "userOrigin": ride.origin, "userDestination": ride.destination, 'price': ride.estimated_price, 'taxiWaitingTime': ride.user_waiting_time, 'licence_plate': driver.licence_plate });
                            }
                        });
                    }
                }
                else
                    res.status(400).json({ 'message': 'neuspesno' });
            });
        };
        this.getRides = (req, res) => {
            let email = req.query.email;
            rides_1.default.find({ 'user_email': email, 'status': 'finished' }, (err, rides) => {
                if (err)
                    console.log(err);
                else {
                    var o = {};
                    var key = 'Ride';
                    o[key] = [];
                    rides.forEach(ride => {
                        o[key].push(ride);
                    });
                    res.status(200).json(o);
                }
            });
        };
    }
}
exports.UserController = UserController;
function isNight() {
    let date_obj = new Date();
    let currHours = date_obj.getHours() + 1;
    if (currHours < 22 && currHours > 6)
        return false;
    return true;
}
function isWeekend() {
    let date_obj = new Date();
    let currDay = date_obj.getDay() + 1;
    if (currDay == 1 || currDay == 7)
        return true;
    return false;
}
function isHoliday() {
    let date_obj = new Date();
    let day = date_obj.getDate() + 1;
    let month = date_obj.getMonth() + 1;
    let year = date_obj.getFullYear();
    // neki upit da li za ove parametre ima neki praznik
}
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
function formatDate(date) {
    return ([
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
    ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes()),
            padTo2Digits(date.getSeconds()),
        ].join(':'));
}
//# sourceMappingURL=user.controler.js.map