import express, { Router } from 'express';
import user from '../models/users';

import { DriverControler } from '../controllers/driver.controler';

const driverRouter= express.Router();
driverRouter.route('/changeActivity').post(
    (req,res)=>new DriverControler().changeActivity(req,res)
)
driverRouter.route('/inRange').get((req,res)=>
new DriverControler().inRange(req,res))

driverRouter.route('/acceptRide').post((req,res)=>
new DriverControler().acceptRide(req,res))

driverRouter.route('/getRideWaitingDuration').get((req,res)=>
new DriverControler().getRideWaitingDuration(req,res))

driverRouter.route('/getMaxDistance').get((req,res)=>{
    new DriverControler().getMaxDistance(req,res)
})
driverRouter.route('/getLocationRefreshTime').get((req,res)=>{
    new DriverControler().getLocationRefreshTime(req,res)
})
driverRouter.route('/sendDriverLocation').post((req,res)=>
{
    new DriverControler().receiveDriverLocation(req,res)
})
driverRouter.route('/getActiveRide').get((req,res)=>
{
    new DriverControler().getActiveDrive(req,res)
})

driverRouter.route('/setUserIrregular').post((req,res)=>
{
    new DriverControler().setUserIrregular(req,res)
})
driverRouter.route('/rideFinished').get((req,res)=>
{
    new DriverControler().rideFinished(req,res)
})
driverRouter.route('/getTodayStatistic').get((req,res)=>{
    new DriverControler().getTodayStatistic(req,res)
})
driverRouter.route('/getStatistic').get((req,res)=>
{
    new DriverControler().getStatistic(req,res)
})


driverRouter.route('/getMonthStatistic').get((req,res)=>{
    new DriverControler().getMonthStatistic(req,res)
})
export default driverRouter;