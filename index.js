const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ni8nft9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // MongoDB collections
    const userCollection = client.db("Assignment-12").collection("users");

    // store users data
    app.post('/users', async(req,res)=>{
        const user = req.body;
        //check if the email already exists
        const query = { email: user?.email};
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
            return res.send({message: "user already exists", insertedId: null})
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
    })
    //get user data
    app.get('/users', async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    //patch user data when verified
    app.patch('/users/admin/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      //find the user
      const existingUser = await userCollection.findOne(filter);
      //if there is no user 
      if(!existingUser) res.status(404).send({error: 'user not found'});
      //toggle the verified property
      const updatedVerified = !existingUser.verified;
      const updatedDoc = {
        $set: {
          verified: updatedVerified
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    //remove this before deploy
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
