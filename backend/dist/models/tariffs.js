"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = mongoose_1.default.Schema;
let Tariff = new Schema({
    name: {
        type: String
    },
    starting_price: {
        type: Number
    },
    price_per_km: {
        type: Number
    },
    night: {
        type: Boolean
    },
    weekend: {
        type: Boolean
    },
    holiday: {
        type: Boolean
    }
});
exports.default = mongoose_1.default.model('Tariff', Tariff, 'tariffs');
//# sourceMappingURL=tariffs.js.map