const express = require("express"); //express as middleware for hosting the server
const mongoose = require("mongoose"); //another middleware that makes it easier to interface with a mongoDB database
const bodyParser = require("body-parser"); //takes the body of the HTML or JSON document and parses it so we can use the data
const path = require("path"); //part of express
//Added - Login
//*6
const session = require("express-session");
const bcrypt = require("bcryptjs");
//*11
//Added - Registering Users
const User = require("./models/User");
const Person = require("./models/Person");
//*16
//Added - Hide sensitive information
require("dotenv").config();

const app = express();
const port = process.env.port||3000; //if not environment, default to 3000
//const port = 3000;

//Create public folder as static
//*4
app.use(express.static(path.join(__dirname, "public")));

//Set up middleware to parse json requests
app.use(bodyParser.json());
//Needed for Add to List
app.use(express.urlencoded({extended:true}));

//Login
//*7
app.use(session({
    //*17
    //Added - Hide sensitive information
//  secret: "12345", //connection secret moved to .env
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false} //set to true if using https (aka have a ssl certificate)
}));

//Create a fake user in our database
//*13 - Commented out for Registering Users
// const user = {
//     admin:bcrypt.hashSync("12345", 10) //(secret/password, default hash value?)
// };

//Check Authentication
function isAuthenticated(req,res,next){
    if(req.session.user) return next(); //valid credentials, let them pass
    return res.redirect("/login"); //not valid credentials, redirect back to login page
};
//

//MongoDB connection setup
//const mongoURI = "mongodb://localhost:27017/crudapp"; // slash database //default URI
//*15
//Added - Access non-local DB
//const mongoURI = "mongodb+srv://rtester:rfayetester@cluster0.kraow.mongodb.net/"; // slash database //connection string moved to .env
//*18
//Added - Hide sensitive information
const mongoURI = process.env.MONGODB_URI; // slash database 
//
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
//*10 - MODIFIED - Moved to Person.js
// const peopleSchema = new mongoose.Schema({ //basic template for the data we're trying to retrieve from db
//     firstname:String,
//     lastname:String,
//     email:String
// }); 

// const Person = mongoose.model("Person", peopleSchema, "peopledata"); //use Person to call mongoDB commands //something, schema, name of collection

//App Routes
app.get("/", (req,res)=>{
    res.sendFile("index.html"); 
});

//*8
//Added - Login
app.get("/users", isAuthenticated, (req,res)=>{
    res.sendFile(path.join(__dirname, "public", "users.html")); 
});

app.get("/login", (req,res)=>{
    res.sendFile(path.join(__dirname + "/public/login.html"));
});
//

//Added - Register user
//*12
app.get("/register", (req,res)=>{
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.post("/register", async (req,res)=>{
    try{
        const {username, password, email} = req.body;

        const existingUser = await User.findOne({username});

        if(existingUser){
            return res.send("Username already taken. Try a different one");
        }

        const hashedPassword = bcrypt.hashSync(password, 10); //Create hashed password //num is how encrypted you want it to be
        const newUser = new User({username, password:hashedPassword, email});
        await newUser.save();

        res.redirect("/login");

    }catch(err){
        res.status(500).send("Error registering new user.");
    }
});
//

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
        //res.status(201).json(savePerson);
        res.redirect("/users");
        console.log(savePerson); //log the data that got saved
    } catch(err){
        res.status(500).json({error:"Failed to add new person."});
    }
});

//Added - Login
//*9
// app.post("/login", (req, res)=>{
//     const {username, password} = req.body;
//     console.log(req.body);
//     if(user[username] && bcrypt.compareSync(password, user[username])){
//         req.session.user = username;
//         return res.redirect("/users");
//     }
//     //Not valid login
//     req.session.error = "Invalid User";
//     return res.redirect("/login");
// });

//MODIFIED for Registering User
//*14
app.post("/login", async (req, res)=>{
    const {username, password} = req.body;
    console.log(req.body);

    const user = await User.findOne({username});
    if(user && bcrypt.compareSync(password, user.password)){ //Check if password in db and inputted password match
        req.session.user = username;
        return res.redirect("/users");
    }
    //Not valid login
    req.session.error = "Invalid User";
    return res.redirect("/login");
});
//

//Added - Logout
//*9
app.get("/logout", (req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/login")
    });
});
//

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