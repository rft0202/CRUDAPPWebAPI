const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username:{type:String, required:true, unique:true}, //object that sets up the different parameters
    password:{type:String, required:true},
    email:{type:String, required:true}
});

const User = mongoose.model("User", userSchema, "users"); //name, schema, ?

module.exports = User;