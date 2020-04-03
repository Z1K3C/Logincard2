const mongoose = require('mongoose');                           //Mando llamar al modulo mongoose para poder
const { NOTES_APP_MONGODB_HOST, NOTES_APP_MONGODB_DATABASE } = process.env;
const MONGODB_URI = `mongodb://${NOTES_APP_MONGODB_HOST}/${NOTES_APP_MONGODB_DATABASE}`;
                                                                //utilizar metodos de conexion a DBs de mongodb
mongoose.connect(MONGODB_URI,{             //Utilizo connect con la URL, si la tabla no existe
  useNewUrlParser: true,                                        //se crea despues del localhost/"nombredelatabla"
  useUnifiedTopology: true,
  useFindAndModify: false 
}).catch(function (err) { console.log('error',err.message)})   //Mediante promesa si regresa un error lo imprime
  .then(function (db) { console.log('DBconnected') });         //En caso contrario imprime un mensaje
  