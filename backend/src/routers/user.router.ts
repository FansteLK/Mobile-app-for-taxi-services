import express, { Router } from 'express';
import user from '../models/users';

import { UserController } from '../controllers/user.controler';

const userRouter= express.Router();
userRouter.route('/login').post(
    (req,res)=>new UserController().login(req,res)
)
userRouter.route('/register').post( (req,res)=>
{
    new UserController().register(req,res)
})
userRouter.route('/requestPrice').get((req,res)=>
    new UserController().requestPrice(req,res)
)
userRouter.route('/userRideResponse').get((req,res)=>{
    
  new UserController().userRideResponse(req,res)

})
userRouter.route('/getActiveRide').get((req,res)=>
{
    new UserController().getActiveDrive(req,res)
})

userRouter.route('/getRides').get((req,res)=>{
    new UserController().getRides(req,res);
})
export default userRouter;