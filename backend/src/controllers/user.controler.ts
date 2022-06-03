import express, { Response } from 'express'

import User from '../models/users'
import Tariff from '../models/tariffs'
import Ride from '../models/rides'
import Value from '../models/value'
import * as bcrypt from 'bcryptjs'
import { Admin, Timestamp } from 'mongodb';
import { isWeakMap } from 'util/types';
import { dir } from 'console';
import { OutgoingMessage } from 'http'
import { user } from 'firebase-functions/v1/auth'
import { schedule } from 'firebase-functions/v1/pubsub'
import rides from '../models/rides'
const axios = require('axios');



export class UserController
{
    duplicate_email:Boolean;
    duplicate_number:Boolean;
    login=async (req:express.Request,res:express.Response)=>
    {

        let email=req.body.email;
        let password = req.body.password;
     
        const user=await User.findOne({'email':email}).catch(err=>
        {
            console.log(err);
        })
        if (user){
            const validPassword = await bcrypt.compare(password, user.password);
           if (validPassword) {
               if (user.regular)
            res.status(200).json(user);
            else
            {
                res.status(400).json({ error: "User isnt regular" }); 
            }
          } else {
              
            res.status(400).json({ error: "Invalid Password" });
        }
  
        }
        else
        {
            res.status(401).json({ error: "User does not exist" });
        }
    }
     register=async (req:express.Request,res:express.Response)=>
    {
      
      
        let email=req.body.email;
        let password = req.body.password;
        let number= req.body.number;
    
         const salt =await bcrypt.genSaltSync(10);
         password =await bcrypt.hashSync(password, salt); 
         let userAdd= new User({
            email:email,
            password:password,
            number:number,
            type:"user",
            availability:null,
            regular:true
         })
       User.findOne({'email':req.body.email},(err,user)=>{
          
            if(err) {console.log(err);
                return}
           
            if (user)  {
        
                res.status(400).json({'message':'The email is already linked to another account'})
        
              
             }
             else
             {
                User.findOne({'number':number},(err,user2)=>
                {   
                    if(user2)
                    {
                        res.status(400).json({'message':'The number is already linked to another account'})
                    }
                    else
                    {
                        userAdd.save().then(user=>{
                            res.status(200).json({'message': 'user added'});
                        }).catch(err=>{
                            res.status(400).json({'message': 'error'})
                        })
                    }

                })
             
             }
        
        })
   

}


requestPrice = (req:express.Request,res:express.Response)=>
{   

 
    let user_email= req.query.user_email;
    let origin= req.query.origin;
    let destination=req.query.destination;
    let distance = Number(req.query.distance)/1000;
    let duration= Number(req.query.duration);
    let traffick_duration=Number(req.query.traffic_duration);

    let traffick_coeficient=1;

    if (traffick_duration>duration)
    {
     traffick_coeficient=((traffick_duration/duration)-1)/2+1;

    }
    Ride.deleteMany({'user_email':user_email,'status':''},(err,rides)=>
    {
        
    });

  
    let night = isNight();
    let weekend = isWeekend();
    let holiday= false;
    //let holidat= isHoliday();
    Tariff.findOne({$and: [ {'night':night},{'weekend':weekend},{'holiday':holiday}] },(err,tariff)=>
    {
        if (err)
        {
            console.log(err);
        }
        else
        {
            let price = tariff.starting_price;
            price += tariff.price_per_km *(distance-1) * traffick_coeficient;
            price = price.toFixed(2);
        
            Ride.findOne({$and:[{$or:[{'status':'scheduled'},{'status':'accepted'}]},{'user_email':user_email}]},(err,ride)=>
            {
                if (err)
                {
                    console.log(err);
                }
                else
                {
                   
                    if(ride)
                    {
                        res.status(400).json({'message':'You already have a drive scheduled'})
                  
                    }
                    else
                    {
                       User.findOne({'email':user_email,'regular':true},(err,user)=>
                       {
                           if (err) console.log(err)
                           if (user)
                           {
                            let ride = new Ride({
                                user_email:user_email,
                                origin:origin,
                                destination:destination,
                                estimated_price:price,
                                estimated_duration:traffick_duration,
                                status:'',
                                distance:distance,
                                user_waiting_time:null,
                                driver:null,
                                user_token:null,
                                taxiOrigin:null,
                                date:formatDate(new Date())
    
                            })
                            ride.save().then(ride=>{
                                res.status(200).json({'price': price});
                               
                            }).catch(err=>{
                                res.status(400).json({'message': 'error'})
                            })
                           }
                           else
                           {
                            res.status(400).json({'message': 'User isnt regular'})
                           }
                       })
                   
                    }
                }
            })
          
        }
    })
 
}

userRideResponse=(req:express.Request,res:express.Response)=>
{
    let isAccepted= req.query.response;
    let email = req.query.email;
    let token = req.query.token;

    if (isAccepted==="true")
    {
        Ride.findOneAndUpdate({'user-email':email,'status':''},{$set:{'user_token':token,'status':'scheduled'}},(err,ride)=>{
            if(ride){
                User.findOne({'email':email,'regular':true},(err,user)=>
                {
                   
                    if (err) console.log(err)
                    if (user)
                    {
                       
                        let uri='https://us-central1-taxiapp-54da0.cloudfunctions.net/sendDriverDistanceRequest?address='+ride.origin+"&user="+ride.user_email+"&dstAddress="+ride.destination;
                        let encoded=encodeURI(uri)
                        axios.get(encoded)
                        .then(res => {
                         
                    
                          })
                          .catch(error => {
                            console.error(error);
                          });
                        
                          res.status(200).json({'message':'uspesno'})
                    }
                    else
                    {
                     
                        res.status(400).json({'message':'User isnt regular'})   
                    }
                })
               
     
            }
     
        })
  
        Value.findOne({'name':'request_waiting_duration'},(err,value)=>{
 
            if (err) console.log(err);
            else
            {
            
                if (value)
                {
                
                    
                            let n: ReturnType<typeof setTimeout>;
                            n = setTimeout(function(){
                               
                                        Ride.findOneAndUpdate({'user-email':email,'status':'scheduled'},{$set:{'status':'canceled'}},(err,ride)=>{
                                            if (ride){
                                            
                                                axios.get('https://us-central1-taxiapp-54da0.cloudfunctions.net/sendNoRide?token='+token).then(res => {
                                                   
                                            }
                                        ).catch(err=>
                                            {
                                                console.error(err); 
                                            })
                               
                                   
                             }})},value.value*1000);  
                    
                   
                  
                }
            }
        })
      
       
      
    }
    else
    {

        Ride.findOneAndDelete({'user_email':email,'status':'scheduled'}).then(()=>
        {
           
            res.status(400).json({'message':'declined'})
            // res.status(200).json({'message':'uspesno'})
        }).catch((err)=>
        {
            console.log(err)
            res.status(400).json({'message':'neuspesno'})
        })
    }

}

getActiveDrive=(req:express.Request,res:express.Response)=>
{
 
    let email=req.query.email as string
    Ride.findOne({$and:[{$or:[{'status':'scheduled'},{'status':'accepted'}]},{'user_email':email}]},(err,ride)=>
    {
   
        if (err) console.log(err);
    
        if (ride)
        {
            if (ride.status=='scheduled')
            {
                res.status(200).json({'status':ride.status});
            }
            else{
            User.findOne({'email':ride.driver},(err,driver)=>
            {
                if (err) console.log(err);
                else
                {
                    
                    res.status(200).json({'status':ride.status,'taxiOrigin':ride.taxiOrigin,"userOrigin":ride.origin,"userDestination":ride.destination,'price':ride.estimated_price,'taxiWaitingTime':ride.user_waiting_time,'licence_plate':driver.licence_plate})
                }
            })
        }

        }  
        else
        res.status(400).json({'message':'neuspesno'})
    })
}

getRides=(req:express.Request,res:express.Response)=>
{
    let email=req.query.email as string
    Ride.find({'user_email':email,'status':'finished'},(err,rides)=>
    {
        if (err) console.log(err);
        else
        {
            


     var o = {} 
     var key = 'Ride'
     o[key] = []
     rides.forEach(ride => {
        o[key].push(ride)
     });
     
            res.status(200).json(o);
        }
    })
}


}

function isNight() {
 
    let date_obj =new  Date();
     let currHours= date_obj.getHours()+1;
     if (currHours<22 && currHours>6) return false;
    return true;
    
}
function isWeekend()
{
    let date_obj= new Date();
    let currDay = date_obj.getDay()+1;
    if (currDay==1 || currDay==7) return true;
    return false;
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