"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
let Ride = new Schema({
    user_email: {
        type: String
    },
    driver: {
        type: String
    },
    origin: {
        type: String
    },
    destination: {
        type: String
    },
    estimated_price: {
        type: Number
    },
    estimated_duration: {
        type: Number
    },
    distance: {
        type: Number
    },
    status: {
        type: String
    },
    user_waiting_time: {
        type: Number
    },
    user_token: {
        type: String
    },
    taxiOrigin: {
        type: String
    },
    date: {
        type: Date
    }
});
exports.default = mongoose_1.default.model('Ride', Ride, "rides");
//# sourceMappingURL=rides.js.map