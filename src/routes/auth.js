const helpers = {};                               //inicializo una variable llamada helper

helpers.isAuthenticated = (req, res, next) => {   //Genero una funcion fecha tipo middleware
  if (req.isAuthenticated()) {                    //Utilizo el methodo de passport para verificar la authentificacion
    return next();                                //Si la authentificacion es valida pasa a trabajar lo que este en el codigo
  }                                               //En caso de no ser authentico...
  req.flash('error_msg', 'Not Authorized.');      //Manda un mensaje de error atravez de las global var y los partials.hbs
  res.redirect('/signin');                        //Redirecciona a login
};

module.exports = helpers;                         //Exporta este modulo.