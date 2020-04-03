const express = require('express');                     //Solicito express para usar elementos de servidor
const path = require('path');                           //Solicito el modulo path de express para manejar rutas
const flash = require('connect-flash');                 //Solicito a connect flash para compartir dato entre formularios/URL
const session = require('express-session');             //Solicito el session para manejar sesiones
const methodOverride = require('method-override');      //Solicito override para poder usar los metodos GET/POST/PUT//DELETE
const passport = require('passport');                   //Solicito a passport de manera completa
const multer = require('multer');                       //Solicito a multer para poder almacenar imagenes
const { v4: uuidv4 } = require('uuid');                 //Solicito a uuidv4 para poder generar id para las imagenes
const Handlebars = require('handlebars');               //Solicito a handlerbars para manejar plantillas html/js
const exphbs  = require('express-handlebars');          //Solicito a express handlebars para poder usarlo desde el servidor
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');   //Solicito este modulo para cuando renderice el .hbs pueda leer datos

//Inicialization
const app = express();                                  //Instancio a express en la constante app para poder usar sus metodos
require('dotenv').config();                             //Mando llamar dotenv para poder usar las variables de entorno
require('./database.js');                               //Mando a llamar a la base de datos
require('./passport.js');                               //Mando a llamar la configuracion personalizada de passport para manejar logins

//Settings
app.set('port',process.env.PORT || 3000);               //Inicializo el puerto del servidor
app.set('views', path.join(__dirname, 'views'));        //Indico donde esta la ruta de views
app.engine('.hbs', exphbs({                             //Inicializo el motor de plantillas
  defaultLayout: 'header.main.hbs',                       //Asigno parametros como la plantilla principal
  //layoutsDir: path.join(app.get('views'), 'layouts'),
  //partialsDir: path.join(app.get('views'), 'partials'),
  layoutsDir: app.get('views'),                           //El directorio de los layouts
  partialsDir: app.get('views'),                          //El directorio de los partiales
  handlebars: allowInsecurePrototypeAccess(Handlebars),   //Asigno acceso a los prototipos
  extname: '.hbs'                                         //Asigno el tipo de extencion
}));
app.set('view engine', '.hbs');                        //Inicializo el motor de plantillas en .hbs

//middleware
app.use(express.json());                              //Esto es para poder usar formatos tipo json
app.use(express.urlencoded({extended: false}));       //A travez de este middleware puedo leer datos en los metodos GET/POST/PUT/DEL
app.use(methodOverride('_method'));                   //A travez de este middleware puedo usar los metodos GET/POST/PUT/DEL
app.use(session({                                     //Inicializo el modulo sessions para poder guardar datos entre secicones
  secret: 'secret',                                   //Con esto compartimos datos entre /about con /edit y /notes etc etc
  resave: true,                                       //Previo a compartir datos con flash necesito crear seciones express para
  saveUninitialized: true                             //cada ruta
}));
app.use(passport.initialize());                       //Inicializo a passport
app.use(passport.session());                          //le indico a passport que utilizare seciones
app.use(flash());                                     //A travez de este middleware puedo usar variables globales y compartirlas entre plantillas/seciones
const storage = multer.diskStorage({                  //utilizo la propiedad diskstorage de multer para indicarle ruta y nombre de los
    destination: path.join(__dirname, 'public/img/'), //archivos que seleccionara el usuario a travez de la interfaz
    filename: (req, file, cb, filename) => {
        //console.log(file);
        cb(null, uuidv4() + path.extname(file.originalname));
    }
}) 
app.use(multer({storage}).single('image'));          //A travez de; servidor utilizare a multer para solo imagenes

// Global Variables
app.use((req, res, next) => {                         //Al utilizar flash desde routes este lo redireccionara a las variables locales
  res.locals.success_msg = req.flash('success_msg');  //las cuales mandaran llamar al partial correspondiente en el cual mostrara
  res.locals.error_msg = req.flash('error_msg');      //un mensaje de 'ok' o de 'error'
  res.locals.error = req.flash('error');              //Si passport retorna un error a travez de las variables globales este se mostrara a travez del partials.hbs
  res.locals.user = req.user || null;                 //Si existe un usuario este se almacena en las variables globales, en caso contrario almacena un null
  next();                                             //Este metodo permite que continue el codigo y no se quede solo escuchando
});                                                   //respuestas del cliente

//Routes
app.use(require('./routes/routes.js'));               //Mando a llamar a las rutas

//Static files
app.use(express.static(path.join(__dirname, './public/')));   //Indico el directorio de archivos estaticos asi con HMTLs/CCSs/PNGs/JPGs/ETC

app.listen(app.get('port'), function(){              //Mando a que escuche al servidor en el puerto correspondiente y que muestre un 
  console.log(`Server on port ${app.get('port')}`);  //por pantallas
});