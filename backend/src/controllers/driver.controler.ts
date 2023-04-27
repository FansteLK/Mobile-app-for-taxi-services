import express from 'express'
import { UserController } from './user.controler';
import User from '../models/users'
import Ride from '../models/rides'
import Value from '../models/value'
import { Cipher } from 'crypto';
import { format } from 'path/posix';
const axios = require('axios');
const Worker = require('worker_threads')

export class DriverControler
{
    changeActivity = (req:express.Request,res:express.Response)=>
    {
      

        let  email= req.query.email;
        let  availability = req.query.availability;
        let  availabilityString="available"
       
        if ( availability==="false") 
        availabilityString='unavailable'
       
    

        User.updateOne({"email":email},{$set:{"availability": availabilityString}},(err,user)=>
        {
            if (err ) console.log(err)
            else{
            if (user)
            
            {
                res.status(200).json({'message':'uspesno'})
            }
            else
            {       res.status(400).json({'message':'neuspesno'})

            }
        }
        })

    }
    inRange= (req:express.Request,res:express.Response)=>
    {
     
        let user=req.query.user
        let token=req.query.token
        let duration=req.query.duration;
   
        
        Ride.findOne({'user_email':user,'status':'scheduled'},(err,ride)=>
        {
            if (ride)
            {
                let uri='https://us-central1-taxiapp-54da0.cloudfunctions.net/sendDriverNotification?address='+ride.origin+"&token="+token+"&destination="+ride.destination+"&duration="+duration
                let encoded=encodeURI(uri)
                axios.get(encoded)
                .then(res => {
            
                  })
                  .catch(error => {
                    console.error(error);
                  });
            }
        })
    }
    
    acceptRide=(req:express.Request,res:express.Response)=>
    {
      
        let user=req.query.user
        let token=req.query.token
        let driver = req.query.driver as string
        let duration =req.query.duration
        let taxiOrigin=req.query.taxiOrigin
      
     
    
        Ride.findOneAndUpdate({'user_email':user,'status':'scheduled'},{$set:{'status':'accepted','driver':driver,'user_waiting_time':duration,'taxiOrigin':taxiOrigin}},(err,ride)=>
        {
            if (ride)
            {
           
               
                axios.get('https://us-central1-taxiapp-54da0.cloudfunctions.net/sendDriverAcceptedRide?user='+user)
                .then(res => {
        
                  })
                  .catch(error => {
                    console.error(error);
                  });
              
                  User.findOne({'email':driver},(err,driver)=>{
                      if (err ) console.log(err);
                      else
                      {
                         
                        res.status(200).json({'message':'uspesno'})
                       
                        axios.get('https://us-central1-taxiapp-54da0.cloudfunctions.net/sendUserAcceptedRide?waiting_time='+duration+"&token="+ride.user_token+"&licence_plate="+driver.licence_plate)
                        .then(res => {
                      
               
                          })
                          .catch(error => {
                            console.log(error);
                          });
                        
                      }
                  })
              
                 

            }
            else
            {
               
                res.status(400).json({'message':'neuspesno'})
            }
        })
    }
    getRideWaitingDuration=(req:express.Request,res:express.Response)=>{
      
        Value.findOne({'name':'request_waiting_duration'},(err,value)=>{
                if (err) {console.log(err); return;}
                if (value)
                {
                    res.status(200).json({'value':value.value})
                }
                else
                {
                    res.status(200).json({'value':61}) 
                }
            
        })
    }
    getMaxDistance=(req:express.Request,res:express.Response)=>
    {
        Value.findOne({'name':'max_distance'},(err,value)=>{
            if (err) {console.log(err); return;}
            if (value)
            {
                res.status(200).json({'value':value.value})
            }
            else
            {
                res.status(200).json({'value':61}) 
            }
        })
    }

    getLocationRefreshTime=(req:express.Request,res:express.Response)=>
    {
        Value.findOne({'name':'location_refresh_time'},(err,value)=>{
            if (err) {console.log(err); return;}
            if (value)
            {
                res.status(200).json({'value':value.value})
            }
            else
            {
                res.status(200).json({'value':61}) 
            }
        })
    }

    receiveDriverLocation=(req:express.Request,res:express.Response)=>
    {
        let email = req.query.email as string
        let lon = req.query.lon as string
        let lat = req.query.lat as string
        Ride.findOne({'driver':email,'status':'accepted'},(err,ride)=>
        {
            if (err) console.log(err);
            if (ride)
            {
                axios.get('https://us-central1-taxiapp-54da0.cloudfunctions.net/sendDriverLocationToUser?token='+ride.user_token+"&lat="+lat+"&lon="+lon)
                .then(res => {
            
                  })
                  .catch(error => {
                    console.log(error);
                  });
                res.status(200).json({'message':'uspesno'})
            }
        })
    }

    getActiveDrive=(req:express.Request,res:express.Response)=>
    {
     
        let email=req.query.email as string
        Ride.findOne({'driver':email,'status':'accepted'},(err,ride)=>
        {
       
            if (err) console.log(err);
            if (ride)
            {
              res.status(200).json({'taxiOrigin':ride.taxiOrigin,"userOrigin":ride.origin,"userDestination":ride.destination,"client":ride.user_email})
 
            }  
            else
            res.status(400).json({'message':'neuspesno'})
        })
    }
    setUserIrregular=(req:express.Request,res:express.Response)=>
    {
     
        let email=req.query.email as string
 
        User.findOneAndUpdate({'email':email},{$set:{'regular':false}},(err,user)=>{
            if (err) console.log(err);
            if (user)
            {
             res.status(200).json({'message':'uspesno'})

            }
            else{
                res.status(400).json({'message':'neuspesno'})
            }
        })
    }
    rideFinished=(req:express.Request,res:express.Response)=>
    {
      let email=req.query.email as string
      Ride.findOneAndUpdate({'user_email':email,'status':'accepted'},{$set:{'status':'finished'},},(err,ride)=>
      {
         
          if (err) console.log(err);

          if (ride){
          res.status(200).json({'message':'uspesno'})

        }
        else{
            res.status(400).json({'message':'neuspesno'})
        }
      })
      
      
    }

    getTodayStatistic=(req:express.Request,res:express.Response)=>
    {
        let email=req.query.email as string
      
        
        let dateEnd=formatDate(new Date())
        let dateStartTmp=new Date()
        dateStartTmp.setHours(0)
        dateStartTmp.setMinutes(0)
        dateStartTmp.setSeconds(0)
       let dateStart=formatDate(dateStartTmp)
       Ride.find({'driver':email,'status':'finished',date:{$gte:dateStart,$lte:dateEnd}},(err,rides)=>
       {
        if (err){
            res.status(400).json({'message':'neuspesno'})
        }
           else{
               if (rides){
        let numOfRides=rides.length
        let totalKms=0
        let totalPrice=0
    
        rides.forEach(ride => {
            totalKms+=ride.distance
            totalPrice+=ride.estimated_price
        });
    
        res.status(200).json({'numOfRides':numOfRides,'totalKms':totalKms,'totalPrice':totalPrice})
        
        // let totalKms
        // let totalPrice   

    }
    else
{

    res.status(200).json({'numOfRides':0,'totalKms':0,'totalPrice':0}) 
}
}

    
       })

    }

    getStatistic= async(req:express.Request,res:express.Response)=>
    {
       
        
        let email=req.query.email as string
        let dateEndtmp=new Date()
        let dateStart=new Date()
       
        
     var statistic = {} 
     var key = 'daysStatisticModel'
     statistic[key] = []
 
     var numOfRidesKey='numOfRides'
     var totalKmsKey='totalKms'
     var totalPriceKey='totalPrice'
    
        // while (cnt<=dateStart.getDate())
        // {
     
      
                
                let cnt=0;
    while (cnt<7){
     
        var tmp={}
        let dateStartTmp= new Date(Date.now() - (6-cnt)* 24 * 60 * 60 * 1000)
       
        dateStartTmp.setHours(0)
        dateStartTmp.setMinutes(0)
        dateStartTmp.setSeconds(0)
        let dateEndTmp = new Date(Date.now() - (6-cnt)* 24 * 60 * 60 * 1000)

        dateEndTmp.setHours(24)
        dateEndTmp.setMinutes(0)
        dateEndTmp.setSeconds(0)
      let rides=   await  Ride.find({'driver':email,'status':'finished',date:{$gte:dateStartTmp,$lte:dateEndTmp}})
                 let numOfRides=0
             let totalKms=0
             let totalPrice=0
             if (rides){
                numOfRides=rides.length
             rides.forEach(ride => {
                 totalKms+=ride.distance
                 totalPrice+=ride.estimated_price
             });
            }
             tmp[numOfRidesKey]=numOfRides
             tmp[totalKmsKey]=totalKms
             tmp[totalPriceKey]=totalPrice
             statistic[key].push(tmp)
       cnt++;
    }

    res.status(200).json(statistic)


    }
    getMonthStatistic=async(req:express.Request,res:express.Response)=>
{

    let email=req.query.email as string
    let dateEndtmp=new Date()
    let dateStart=new Date()
   
    
 var statistic = {} 
 var key = 'daysStatisticModel'
 statistic[key] = []

 var numOfRidesKey='numOfRides'
 var totalKmsKey='totalKms'
 var totalPriceKey='totalPrice'
 let cnt=0
 while (cnt<=dateStart.getMonth())
 {
    var tmp={}
    let dateStartTmp= new Date()
    dateStartTmp.setMonth(cnt)
    dateStartTmp.setDate(0)
    dateStartTmp.setHours(0)
    dateStartTmp.setMinutes(0)
    dateStartTmp.setSeconds(0)
    let dateEndTmp= new Date()
    dateEndTmp.setMonth(cnt+1)
    dateEndTmp.setDate(0)
    dateEndTmp.setHours(0)
    dateEndtmp.setMinutes(0)
    dateEndTmp.setSeconds(0)
    if (cnt==11)
    {
        dateStartTmp.setDate(31)
        dateStartTmp.setHours(24)
    }
    let rides=   await  Ride.find({'driver':email,'status':'finished',date:{$gte:dateStartTmp,$lte:dateEndTmp}})
    let numOfRides=0
let totalKms=0
let totalPrice=0
if (rides){
  
   numOfRides=rides.length
rides.forEach(ride => {
    totalKms+=ride.distance
    totalPrice+=ride.estimated_price
});
}

tmp[numOfRidesKey]=numOfRides
tmp[totalKmsKey]=totalKms
tmp[totalPriceKey]=totalPrice
statistic[key].push(tmp)
cnt++;
 }
 while (cnt<=11)
 {
    var tmp={}
    tmp[numOfRidesKey]=0
    tmp[totalKmsKey]=0
    tmp[totalPriceKey]=0
    statistic[key].push(tmp)
    cnt++;

 }
 res.status(200).json(statistic)


}
}


function isHoliday()
{
    let date_obj = new Date();
    let day = date_obj.getDate()+1;
    let month= date_obj.getMonth()+1;
    let year = date_obj.getFullYear();



    // neki upit da li za ove parametre ima neki praznik

}
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  
  function formatDate(date) {
    return (
      [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('-') +
      ' ' +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
      ].join(':')
    );
  }