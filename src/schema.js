const mongoose = require('mongoose');                     //Mando a llamar a mongoose para poder utilizar la DB
const bcrypt = require("bcryptjs");                       //Mando a llamar bcrypt para poder cifrar passwords
const moment = require('moment');                         //Mando a llamar a moment para poder dar formato a la fecha
const { Schema } = mongoose;                              //De mongoose mando a llamar a Schema para poder crear una tabla

const NoteSchema = new Schema(                            //Creo una tabla de nombre NoteSchema
  {
    title: {  type: String,  required: true },            //Creo una columna llamada title de tipo string
    description: {  type: String, required: true  },      //Creo una columna llamada description
    user: { type: String, required: true},                //Creo una columna llamada user
    filename: {type: String},                             //Agrego columnas correspondientes a las porpiedades de la imagen
    path: {type: String},
    originalname: {type: String},
    mimetype: {type: String},
    size: { type: Number},
    date: { type: String, default: function() {           //Cada que se cree un nuevo nota, en el schema mandara a llamar
        return moment().format();                         //una funcion donde retornara la fecha en formato string
      } }
  }
);

const UserSchema = new Schema({                           //Creo una tabla de nombre UserSchema
  name: { type: String, required: true },                 //Creo una columna llamada name
  email: { type: String, required: true },                //Creo una columna llamada email
  password: { type: String, required: true },             //Creo una columna llamada password
  level: { type: String, required: false},
  date: { type: String, default: function() {             //Cada que se cree un nuevo nota, en el schema mandara a llamar
    return moment().format();                             //una funcion donde retornara la fecha en formato string
  } }
});

UserSchema.methods.encryptPassword = async function(password) {  //Creo un metodo asyncrono para encriptar el password
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

UserSchema.methods.matchPassword = async function(password) {   //Creo un meotodo asyncrono para comparar el password
  return await bcrypt.compare(password, this.password);
};

module.exports.Note = mongoose.model("Note", NoteSchema); //Exporto a Note
module.exports.User = mongoose.model("User", UserSchema); //Exporto a User