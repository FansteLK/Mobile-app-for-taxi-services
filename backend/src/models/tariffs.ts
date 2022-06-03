
import mongoose, { Mongoose }  from "mongoose";

const Schema = mongoose.Schema
let Tariff = new  Schema(
    {
        name:
        {
            type:String
        },
        starting_price:
        {
            type:Number
        },
        price_per_km:
        {
            type:Number
        },
        night:
        {
            type:Boolean
        },
        weekend:
        {
            type:Boolean
        },
        holiday:
        {
            type:Boolean
        }


    })
    export default mongoose.model('Tariff',Tariff,'tariffs');