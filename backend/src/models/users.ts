import mongoose, { mongo }  from "mongoose";
const Schema = mongoose.Schema
let User = new Schema({
     email:
     {
         type:String
     },
     password:
     {
         type:String
     },
     type:
     {
         type:String
     },
     number:
     {
         type:String
     },
     availability:
     {
         type:String
     },
     regular:
     {
         type:Boolean
     },
     licence_plate:
     {
         type:String
     }
})
export default mongoose.model('User',User,'users');