const express = require("express"); //express as middleware for hosting the server
const mongoose = require("mongoose"); //another middleware that makes it easier to interface with a mongoDB database
const bodyParser = require("body-parser"); //takes the body of the HTML or JSON document and parses it so we can use the data

const app = express();
const port = process.env.port||3000; //if not environment, default to 3000
//const port = 3000;

//Set up middleware to parse json requests
app.use(bodyParser.json());
//Added
app.use(express.urlencoded({extended:true}));

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

//Setup Mongoose Schema
const peopleSchema = new mongoose.Schema({ //basic template for the data we're trying to retrieve from db
    firstname:String,
    lastname:String,
    email:String
}); 

const Person = mongoose.model("Person", peopleSchema, "peopledata"); //use Person to call mongoDB commands //something, schema, name of collection

//App Routes
app.get("/", (req,res)=>{
    res.send("Server is working");
});

//Read Routes (GET)
app.get("/people", async (req, res)=>{
    try{
        const people = await Person.find(); //call mongoDB to get data
        res.json(people); //respond
    }catch(err){
        res.status(500).json({error:"Failed to get people."});
    }
});

//Grab user by ID
app.get("/people/:id", async (req, res)=>{
    try{
        //console.log(req.params.id);
        const person = await Person.findById(req.params.id);
        if(!person){ //if there isn't a person
            return res.status(404).json({error:"Person not found."}); //not found, return out of function
        }
        res.json(person); //found, respond with person

    }catch(err){
        res.status(500).json({error:"Failed to get person."});
    }
});

//Create Route (POST)
app.post("/addperson", async (req, res)=>{
    try{
        const newPerson = new Person(req.body); //create new instance of a person
        const savePerson = await newPerson.save(); //save the new person
        res.status(201).json(savePerson);
        console.log(savePerson); //log the data that got saved
    } catch(err){
        res.status(500).json({error:"Failed to add new person."});
    }
});

//Update Route (PUT)
app.put("/updateperson/:id", (req,res)=>{
    //Example of a promise statement for async function (alternative to async and callback functions) (used by mongoose)
    Person.findByIdAndUpdate(req.params.id, req.body, { //id, request body
        new:true, //is a new request
        runValidators:true 
    }).then((updatedPerson)=>{ //if it completes, then (automatically pass into promise statement)
        if(!updatedPerson){
            return res.status(404).json({error:"Failed to find person."});
        }
        res.json(updatedPerson); //update person
    }).catch((err)=>{ //function call
        res.status(400).json({error:"Failed to update the person."}); 
    }); 
});

//Delete Route (DELETE)
app.delete("/deleteperson/firstname", async (req,res)=>{
    try{
        const personname = req.query; //query request
        const person = await Person.find(personname); //find using the query

        if(person.length === 0){ //=== means exactly equal to (the data type matches)
            return res.status(404).json({error:"Failed to find the person."}); 
        } 

        const deletedPerson = await Person.findOneAndDelete(personname);
        res.json({message: "Person deleted successfully."});

    }catch(err){
        console.log(err);
        res.status(404).json({error:"Person not found."}); 
    }
}); 

//Starts the server
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`); //string literal
});