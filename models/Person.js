const mongoose = require("mongoose");

//Setup Mongoose Schema
const peopleSchema = new mongoose.Schema({ //basic template for the data we're trying to retrieve from db
    firstname:String,
    lastname:String,
    email:String
}); 

const Person = mongoose.model("Person", peopleSchema, "peopledata"); //use Person to call mongoDB commands //something, schema, name of collection

module.exports = Person;