import mongoose, { mongo }  from "mongoose";
const Schema = mongoose.Schema
let Value = new Schema({
     name:
     {
         type:String
     },
     value:
     {
         type:Number
     }
})
export default mongoose.model('Value',Value,'values');