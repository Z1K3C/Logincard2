const passport = require('passport');                                 //Mando a llamar a passport
const LocalStrategy = require('passport-local').Strategy;             //Mando llamar a passport local para poder usar una estrategia local para poder logearme de manera local, desde una DB local, en vez de una cuenta de correo

const { User } = require('./schema.js');                              //Mando llamar al schema de user

passport.use(new LocalStrategy({                                      //Genero una nueva estrategia local
  usernameField: 'email'                                              //Solicita el parametro email
}, async function(email, password, done){                             //A travez de un async await realizo la validacion del usuario 
  // Match Email's User
  const userfound = await User.findOne({email: email});              //A travez del schema realizo la consulta a la table de mongoDB y obtengo la fila donde esta el usuario
  if (!userfound) {                                                  //Si no existe el usuario
    return done(null, false, { message: 'Not User found.' });        //Manda un mensaje de error
  } else {                                                           //Si existe el usuario
    // Match Password's User
    const match = await userfound.matchPassword(password);           //Utilizo la funcion de matchpassword para comparar el password ingresado en el formulario(el cual sera encryptado) con el password almacenado en la base de datos 
    if(match) {                                                      //Si el password coincide
      return done(null, userfound);                                  //regresa los datos del usuario
    } else {
      return done(null, false, { message: 'Incorrect Password.' }); //En caso de coincidir retorna un error
    }
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);                                                 
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);                                                
  });
});