import mongoose from 'mongoose'
import mongooese from 'mongoose'
const Schema =  mongoose.Schema;
let Ride = new Schema ({
    user_email:
    {
        type:String
    },
    driver:
    {
    type:String
    },
    origin:
    {
        type:String
    },
    destination:
    {
        type:String
    },
    estimated_price:
    {
        type:Number
    },
    estimated_duration:
    {
        type:Number
    },
    distance:
    {
        type:Number
    },
    status:
    {
        type:String
    },
    user_waiting_time:
    {
        type:Number
    },
    user_token:
    {
        type:String
    },
    taxiOrigin:
    {
        type:String
    },
    date:
    {
        type:Date
    }
 
})
export default mongoose.model('Ride',Ride,"rides")