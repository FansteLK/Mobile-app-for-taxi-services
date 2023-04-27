import * as functions from "firebase-functions";
import * as admin from 'firebase-admin'




var firebaseAccountCredentials = require("../taxiapp-54da0-firebase-adminsdk-5jkm0-015aad8b42.json");
const serviceAccount = firebaseAccountCredentials as admin.ServiceAccount
admin.initializeApp({
  credential :admin.credential.cert(serviceAccount)
}
)


        
exports.sendDriverDistanceRequest = functions.https.onRequest(async(req,res)=>
{
   const address = req.query.address as string
   const dstAddress = req.query.dstAddress as string
   const user=req.query.user as string
 
   res.send(admin.messaging().sendToTopic(
    "driver-distance-request-topic",
    {
        data:
        {
            'address':address,
            'user':user,
            'dstAddress':dstAddress

  
        }
    },
    {  
      "priority": "high",
      "webpush": {
      "headers": {
        "Urgency": "high"
      }
    },
      "android":{
        "priority":"high",
        "ttl":"5s"
      }
    }
))

})

exports.sendDriverAcceptedRide = functions.https.onRequest(async(req,res)=>{
  const user= req.query.user as string
  res.send(admin.messaging().sendToTopic(
    'driver-accept-ride-topic',
    {
      data:
      {
        'user':user
      }
    },
    {  
      "priority": "high",
      "webpush": {
      "headers": {
        "Urgency": "high"
      }
    },
      "android":{
        "priority":"high",
        "ttl":"5s"
      }
    }
  ))
})
exports.sendDriverNotification = functions.https.onRequest(async(req,res)=>{

 
  const address=req.query.address as string
  const destination = req.query.destination as string
  const token = req.query.token as string
  const duration=req.query.duration as string

 
  res.send(admin.messaging().sendToDevice(
    token,
  {
    notification:
    {
      title:"Ride",
      body:"Origin:"+address+", Destination:"+destination+", Travel duration"+duration
     

      
    } 
    ,
    data:
    {
      origin:address,
      destination:destination,
      duration:duration
    }
  },
  {  
    "priority": "high",
    "webpush": {
    "headers": {
      "Urgency": "high"
    }
  },
    "android":{
      "priority":"high",
      "ttl":"5s"
    }
  }
  ))
})

exports.sendNoRide = functions.https.onRequest(async(req,res)=>
{
const token=req.query.token as string
res.send(admin.messaging().sendToDevice(
  token,
  {
  notification:
  {
    title:"no Ride",
    body:"There is no ride"
  },
  data:
  {
   message:"There is no ride"
  }
},
{  
  "priority": "high",
  "webpush": {
  "headers": {
    "Urgency": "high"
  }
},
  "android":{
    "priority":"high",
    "ttl":"0s"
  }
}
))
})

exports.sendUserAcceptedRide= functions.https.onRequest(async(req,res)=>{
  const token = req.query.token as string
  const waiting_time= req.query.waiting_time as string
  const licence_plate=req.query.licence_plate as string

  res.send(admin.messaging().sendToDevice(
    token,
    {
      notification:{
        title:"Ride accepted",
        body:"Vehicle with licence plate "+ licence_plate+"will arrive in "+waiting_time+" mins"
      },
      data:
      {

        waiting_time:waiting_time,
       licence_plate:licence_plate

      }
    },
  
    {  
      "priority": "high",
      "webpush": {
      "headers": {
        "Urgency": "high"
      }
    },
      "android":{
        "priority":"high",
        "ttl":"0s"
      }
    }
  ))
})


exports.sendDriverLocationToUser= functions.https.onRequest(async(req,res)=>
{
  const token = req.query.token as string
  const lat= req.query.lat as string
  const lon = req.query.lon as string
 

  res.send(admin.messaging().sendToDevice
  (
    token,
    {
      data:
      {
        title:'drivers-location',
        lon:lon,
        lat:lat

      },
      
    },
    {  
      "priority": "high",
      "webpush": {
      "headers": {
        "Urgency": "high"
      }
    },
      "android":{
        "priority":"high",
        "ttl":"5s"
      }
    }
  ))
})

exports.endUserRide = functions.https.onRequest(async(req,res)=>
{
  const token=req.query.token as string
  res.send(admin.messaging().sendToDevice(
    token,
    {
      data:
      {
        title:'ride-ended'
      }
    }
  ))
})
// exports.addMessage = functions.https.onRequest(async (req, res) => {
//     // Grab the text parameter.
//     const original = req.query.text;
//     // Push the new message into Firestore using the Firebase Admin SDK.
//     const writeResult = await admin.firestore().collection('messages').add({original: original});
//     // Send back a message that we've successfully written the message
//     res.json({result: `Message with ID: ${writeResult.id} added.`});
//   });


//   exports.makeUppercase = functions.firestore.document('/messages/{documentId}')
//     .onCreate((snap, context) => {
//       // Grab the current value of what was written to Firestore.
//       const original = snap.data().original;

//       // Access the parameter `{documentId}` with `context.params`
//       functions.logger.log('Uppercasing', context.params.documentId, original);
      
//       const uppercase = original.toUpperCase();
      
//       // You must return a Promise when performing asynchronous tasks inside a Functions such as
//       // writing to Firestore.
//       // Setting an 'uppercase' field in Firestore document returns a Promise.
//       return snap.ref.set({uppercase}, {merge: true});
//     });

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
