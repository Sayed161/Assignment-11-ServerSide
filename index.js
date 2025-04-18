const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

app.use(cors(
  {origin:'http://localhost:5173',
  credentials:true}
));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eatq1.mongodb.net/?appName=Cluster0`;

// HungerHero
// QqpJhSgoMbypRoqy

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
function VerifyToken(req,res,next){
  const token = req.cookies.token;
  if(!token) return res.status(401).send({message:'Access Denied- No token Found'});
  jwt.verify(token,process.env.ACCESS_TOKEN,(err,user)=>{
    if(err) return res.status(403).send({message:"Invalid Token"});
    req.user = user;
    next();
  });
}

async function run() {
    try {
      // User API 
      app.post('/login',async(req,res)=>{
        const user=req.body;
        const token = jwt.sign(user,process.env.ACCESS_TOKEN,{expiresIn:'24h'});
        res.cookie('token',token,{
          httpOnly:true,
          secure:false,
          sameSite:'strict',

        }).send({success:true,user})
        
      });

      app.post('/logout',(req,res)=>{
        res.clearCookie('token',{
          httpOnly:true,
          secure:false,
        });
        res.send({message:"Logged out Successfully"});
      });

      // Foods API 
      app.get('/foods',async(req, res)=>{
        const {name,id,status,sortby }= req.query;
        const foodDB = client.db("HungerHero").collection("foods");
        let sort = {};
        if (sortby==='desc'){
          sort = {expire:-1};
        }
        if(sortby==='asc')
        {
          sort={expire:1};
        }
        let query = {};
        if (name)
        {
            query["User.displayName"]=name;
        }
        if(status)
        {
          query["status"]=status;
        }
        if (id){
            query._id = new ObjectId(id);
        }
        const cursor = foodDB.find(query).sort(sort);
        const result = await cursor.toArray();
        res.send(result);
      });

      app.post('/foods',VerifyToken,async(req, res)=>{
        const foodDB = client.db('HungerHero').collection("foods");
        const foods = req.body;
        const result = await foodDB.insertOne(foods);
        res.send(result);
      });

      app.delete('/foods/:id',VerifyToken,async(req, res)=>{
        const id = req.params.id;
        const foodDB = client.db('HungerHero').collection("foods");
        const query = { _id: new ObjectId(id) };
        const result = await foodDB.deleteOne(query);
        res.send(result);
      });

      app.put('/foods/:id',VerifyToken,async(req, res)=>{
        const id = req.params.id;
        const {name, location, image, expire, notes, status, quantity} = req.body;
        const foodDB = client.db('HungerHero').collection("foods");
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: {
          name:name,location:location,image:image,expire:expire,
          status:status,notes:notes,quantity:quantity
      } };
        const result = await foodDB.updateOne(query, updateDoc);
        res.send(result);
      })
      app.patch('/foods/:id',VerifyToken,async(req, res)=>{
        const id = req.params.id;
        const {status,notes} = req.body;
        const foodDB = client.db('HungerHero').collection("foods");
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: {
            status:status,notes:notes
        } };
        const result = await foodDB.updateOne(query, updateDoc);
        res.send(result);
      })

      app.get('/food/requested',VerifyToken,async(req,res)=>{
        const foodDB = client.db("HungerHero").collection("requestedFood");
        const {name,id }= req.query;
        let query = {};
        if (name)
        {
            query["UserInfo.displayName"]=name;
        }
        if (id){
            query._id = new ObjectId(id);
        }
        const cursor = foodDB.find(query);
        const result = await cursor.toArray();
        res.send(result);
      })

      app.post('/food/requested',VerifyToken,async(req, res)=>{
        const foodDB = client.db('HungerHero').collection("requestedFood");
        const foods = req.body;
        const result = await foodDB.insertOne(foods);
        res.send(result);
      });

    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
run(); 

app.get("/", async (req, res) => {
    res.send("Hello World!");
  });
  

app.listen(port,()=>{
    console.log(`Server is running on port: ${port}`);
})