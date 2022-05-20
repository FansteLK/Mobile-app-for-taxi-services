import express from 'express';
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import userRouter from './routers/user.router';
import driverRouter from './routers/driver.router';



const app = express();
app.use(cors());
app.use(bodyParser.json());




mongoose.connect('mongodb://localhost:27017/taxiprojekat');
const connection = mongoose.connection;

connection.once('open',()=>{
    console.log('db connection ok')
    
})

const router = express.Router();
router.use('/users',userRouter)
router.use('/drivers',driverRouter)
app.use('/',router);

app.get('/myapp/test/', function(req, res){
    res.send("");
});
app.listen(4000, () => console.log(``));