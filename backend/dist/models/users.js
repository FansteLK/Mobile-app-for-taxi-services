"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
let User = new Schema({
    email: {
        type: String
    },
    password: {
        type: String
    },
    type: {
        type: String
    },
    number: {
        type: String
    },
    availability: {
        type: String
    },
    regular: {
        type: Boolean
    },
    licence_plate: {
        type: String
    }
});
exports.default = mongoose_1.default.model('User', User, 'users');
//# sourceMappingURL=users.js.map