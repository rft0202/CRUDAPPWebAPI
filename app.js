const express = require("express"); //express as middleware for hosting the server
const mongoose = require("mongoose"); //another middleware that makes it easier to interface with a mongoDB database
const bodyParser = require("body-parser"); //takes the body of the HTML or JSON document and parses it so we can use the data

const app = express();
const port = process.env.port||3000; //if not environment, default to 3000
//const port = 3000;

//Set up middleware to parse json requests
app.use(bodyParser.json());

//MongoDB connection setup
const mongoURI = "mongodb://localhost:27017/crudapp"; // slash database //default URI
mongoose.connect(mongoURI); 
//deprecated:
//mongoose.connect(mongoURI, {
//    useNewURLParser:true,
//    useUnifiedTopology:true
//});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error")); //check if the database is running. If not, display error
db.once("open", ()=>{
    console.log("Connected to MongoDB Database");
});

//Added - Setup Mongoose Schema
const peopleSchema = new mongoose.Schema({ //basic template for the data we're trying to retrieve from db
    firstname:String,
    lastname:String,
    email:String
}); 

//Added 
const Person = mongoose.model("Person", peopleSchema, "peopledata"); //use Person to call mongoDB commands //something, schema, name of collection

//Added - App Routes
app.get("/", (req,res)=>{
    res.send("Server is working");
});

//Added
app.get("/people", async (req, res)=>{
    try{
        const people = await Person.find(); //call mongoDB to get data
        res.json(people); //respond
    }catch(err){
        res.status(500).json({error:"Failed to get people."});
    }
});

//Starts the server
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`); //string literal
});