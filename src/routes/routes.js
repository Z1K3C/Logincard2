const express = require("express");                       //Mando llamar a express
const router = express.Router();                          //Utilizo el motodo router de express
const passport = require('passport');                     //Mando llamar a passport completo
const moment = require('moment');                         //Mando a llamar a moment para poder dar formato a la fecha
const path = require('path');
const { remove } = require('fs-extra');
const { Note, User } = require("../schema.js");           //De schema mando a utilizar los schemas Note y User
const { isAuthenticated } = require("./auth.js");         //Mando a llamar el metodo que verifica si esta authentificado

/*---------------- Ruta principal ----------------*/

router.get("/", function(req,res) {
    res.render("index.hbs");                              //Cuando el usuario inicialice la pagina web renderizara
});                                                       //a index.hbs junto con el main y los partials

router.get("/about", function(req,res) {
  res.render("about.hbs");                                //Cuando acceda a about renderizara
});                                                       //a about.hbs junto con el main y los partials

/*---------------- Rutas de notas ----------------*/

router.get("/add", isAuthenticated, function(req,res) {   //Cuando el usuario acceda a add
  res.render("note.newnote.hbs");                         //Renderizara el formulario para agregar una nota
});

router.post("/newnote", isAuthenticated, async function (req,res) {        //Cuando el usuario sea enviado a newnote desde el motodo POST
  let errors = [];  
  let file = req.file;
  let imageok;
  const { title, description } = req.body;                //tomara los datos del body de donde fue enviado
  if(file != undefined){
    imageok = file.mimetype;
    imageok = imageok.slice(0,5)
    if(imageok != 'image')
      errors.push({ text: "Please select a Image" });
  }else
    errors.push({ text: "Please select a Image" });
  if (!title) {                                           //Si el usuario no escribio un titulo agrega este mensaje al array
    errors.push({ text: "Please Write a Title." });
  }
  if (!description) {                                     //Si el usuario no escribio una descripcion agrega este mensaje al array
    errors.push({ text: "Please Write a Description" });
  }
  if (errors.length > 0) {                                //Si hay mas de un error
    res.render("note.newnote.hbs", {                      //Renderiza de nueva cuenta new note, e inicializa estas tres
      errors,                                             //variables las cuales se mostraran en el formulario
      title,
      description
    });
  }else {
    let newNote = new Note({ title, description });       //En dado caso que el usuario si alla llenado el formulario OK inicializa un nueva schema y guardalo en newnote ya con los datos de title y description 
    newNote.user = req.user.id;                           //Asigno el valor del usuario logeado
    newNote.filename = file.filename;
    newNote.path = path.join(__dirname, 'public/img/'),
    newNote.originalname = file.originalname;
    newNote.mimetype = file.mimetype;
    newNote.size = file.size;    
    await newNote.save();                                 //Guarda este nuevo schema en la base de datos
    req.flash("success_msg", "Note Added Successfully");  //Utilizando flash lo mando a las var globals para que posteriormente renderice con partials el mensaje correspondiente
    const admin = req.user.level || '';                   //Pregunto el nivel del usuario logeado, si no tiene le asigno nada a admin
    if (admin !== "superuser") {                          //Si el usuario no es super user...
      res.redirect("/notes");                             //redireccionalo a notes
    }else                                                 //En caso contrario 
      res.redirect("/admin");                             //Mandalo a la ruta admin
  }
});

router.get("/notes", isAuthenticated, async function(req,res) {           //Cuando el usuario acceda a notes 
  let notes = await Note.find({user: req.user.id}).sort({date: 'desc'});  //Realizo una consulta a la base de datos para encontrar todo y lo almaceno en notes
  for(let i=0; i<notes.length; i++)                         //sobre escribo el formato para la fecha
    notes[i]['date'] = moment(notes[i]['date']).fromNow();  //utilizando la libreria de moment
  res.render("note.allnotes.hbs", { notes });               //Renderizo el formulario de all notes y le paso la variable notes para que imprima las tarjetas de cada una de las notas

});

router.get("/edit/:id", isAuthenticated, async (req, res) => {  //Si el usuario pulsa el boton de editar del formulario anterior este realizara lo siguiente:
  const note = await Note.findById(req.params.id);              //almaceno el id que se transfirio a travez de la URL para generar una consulta a la base de datos y buscar la fula correspondiente a ese id y lo almaceno en note
  if (note.user != req.user.id) {                               //Si al usuario no le pertenecen las notas
    req.flash("error_msg", "Not Authorized");                   //Indicar que no esta autorizado
    return res.redirect("/notes");
  }else                                                         //En caso contrario...
    res.render("note.editnote.hbs", { note });            //Renderizo el formulario de edit note y le paso el parametro de note

});

router.put("/editnote/:id", isAuthenticated, async function(req,res) {     //Si el usuario pulsa el boton de guardar del formulario anterior este realizara lo sifuiente:
  const { title, description } = req.body;                //Guardara el title y el description obtenidos a travez de body
  const user = req.user.id; 
  const date = moment().format();
  let errors = [];  
  let file = req.file;
  let Selnewimage = false;
  let imageok ;
  if(file != undefined){
    Selnewimage = true;
    imageok = file.mimetype.toString();
    imageok = imageok.slice(0,5);
    if(imageok != 'image')
      errors.push({ text: "Please select a Image valid" });
  }
  if (errors.length > 0)                                 //Si hay mas de un error
    res.redirect("/edit/" + req.params.id); 
  else{

    if(Selnewimage){

      /*
      using unlink module of fs-extra@v7.0.1
      var imaged = await Note.findById(req.params.id);
      try {
        const pathd = path.resolve('./src/public/img/' + imaged.filename);
        console.log(imaged);
        await fsextra.unlink(pathd);
      } catch (error) {
        console.log(error);
      }
      */
      const imaged = await Note.findById(req.params.id);
      await remove(path.resolve('./src/public/img/' + imaged.filename));

      const filename = file.filename;
      const mypath = path.join(__dirname, 'public/img/');
      const originalname = file.originalname;
      const mimetype = file.mimetype;
      const size = file.size;   

      await Note.findByIdAndUpdate(req.params.id, { title, description, user, filename, mypath, originalname, mimetype, size, date });
    }else
      await Note.findByIdAndUpdate(req.params.id, { title, description, user, date });
    //await Note.findByIdAndUpdate(req.params.id, { title, description, date });  //Realiza un update de la fila con el id
    req.flash("success_msg", "Note Updated Successfully");  //Utilizando flash lo mando a las var globals para que posteriormente renderice con partials el mensaje correspondiente
    const admin = req.user.level || '';                   //Pregunto el nivel del usuario logeado, si no tiene le asigno nada a admin
    if (admin !== "superuser") {                          //Si el usuario no es super user...
      res.redirect("/notes");                             //redireccionalo a notes
    }else                                                 //En caso contrario 
      res.redirect("/admin");                             //Mandalo a la ruta admin     
  }

});

router.delete("/delete/:id", isAuthenticated, async (req, res) => {       //Si el usuario pulsa el boton de eliminar del formulario de all notes
  const datad = await Note.findByIdAndDelete(req.params.id);            //Realizo una consulta del tipo eleminiar a la base de datos a traves de la fila con id de numero tal
  await remove(path.resolve('./src/public/img/' + datad.filename));

  req.flash("success_msg", "Note Deleted Successfully");  //Utilizando flash lo mando a las var globals para que posteriormente renderice con partials el mensaje correspondiente 
  const admin = req.user.level || '';                   //Pregunto el nivel del usuario logeado, si no tiene le asigno nada a admin
  if (admin !== "superuser") {                          //Si el usuario no es super user...
    res.redirect("/notes");                             //redireccionalo a notes
  }else                                                 //En caso contrario 
    res.redirect("/admin");                             //Mandalo a la ruta admin
});

router.get("/admin", isAuthenticated, async (req, res) => {  //Si el usuario tiene los privilegios, en el partial.hbs mostrara un boton adicional que tendra acceso a esta ruta
  const admin = req.user.level || '';                        //Consulto el nivel del usuario, si tiene algo lo guarda en admin, en caso contrario gguarda un string vacio
  if(admin === "superuser"){                                //Si el usuario tiene el nivel
    let notes = await Note.find().sort({date: 'desc'});     //Realizo una consulta a la base de datos para encontrar todo y lo almaceno en notes
    for(let i=0; i<notes.length; i++){                      //Realizo un for por cada nota almacenada en la DB
      let userrow = await User.findById( notes[i]['user'] );  //Almaceno al usuario de la nota
      notes[i]['date'] = moment(notes[i]['date']).format('LLLL');   //Extraigo la fecha de creacion de la nota y la convierto con moment js method
      notes[i]['user'] = userrow['name'];                   //Extraigo el nombre del que creo la nota y sobrescribo en el arreglo
    }                   
    res.render("note.adminotes.hbs", { notes });           //Renderizo el formulario de all notes y le paso la variable notes para que imprima las tarjetas de cada una de las notas
  }else{                                                   //En caso de no contar con los privilegios...
    req.logout();                                         //Deslogea al usuario
    req.flash("error_msg", "You are not Administrator");               //Indica que no esta  autorizado
    return res.redirect("/signin");                       //Redirecciona a sign in
  }
});

router.get("/adminedit/:id", isAuthenticated, async (req, res) => {              //Si el usuario pulsa el boton de editar del formulario admin lo redirecciona a esta ruta
  const admin = req.user.level || '';                     //Consulto el nuvel del usuario
  if (admin !== "superuser") {
    req.flash("error_msg", "You are not Administrator");  //Si no tiene permisos lo redirecciona a sus notas
    return res.redirect("/notes");
  }else{                                                  //Si tiene el nivel puede ver todas las notas
    const note = await Note.findById(req.params.id);      //almaceno el id que se transfirio a travez de la URL para generar una consulta a la base de datos y buscar la fila correspondiente a ese id y lo almaceno en note
    res.render("note.editnote.hbs", { note });            //Renderizo el formulario de edit note y le paso el paraemtro de note
  }
});

/*---------------- Rutas de user ----------------*/

router.get("/signup", function(req,res) {                 //Si el usuario accede a la ruta sign up
  res.render("user.signup.hbs");                          //Renderiza el formulario para poder darse de alta
});

router.post("/signup", async function(req,res) {          //Si el usuario pulsa el boton de guardar del formulario anterior...
  let errors = [];                                        //Inicializo un array vacio para errores
  const { name, email, password, confirm_password } = req.body;   //Almaceno los datos correspondientes
  if (password != confirm_password) {                     //Si el password no e igual
    errors.push({ text: "Passwords do not match." });     //Manda un mensaje de error
  }
  if (password.length < 4) {                              //Si el password es menor a letras 
    errors.push({ text: "Passwords must be at least 4 characters." });
  }
  if (errors.length > 0) {                                //Si el array de error es mayor a 1
    res.render("user.signup.hbs", {                       //Renderiza el formulario con los datos y le mensaje de error
      errors,
      name,
      email,
      password,
      confirm_password
    });
  } else {                                                          //En dado caso de que no alla habido errores
    // Look for email coincidence
    const emailUser = await User.findOne({ email: email });         //Realizo una cosulta a la db a tracez del email
    if (emailUser) {                                                //Si el email ya esta en la base de datos
      req.flash("error_msg", "The Email is already in use.");       //Arrojo un horror
      res.redirect("/signup");                                      //Redirecciono a /signup
    } else {                                                        //En caso de que no exista el email
      // Saving a New User
      const newUser = new User({ name, email, password });          //Genero un nuevo User schema con los datos correspondientes
      newUser.password = await newUser.encryptPassword(password);   //Encripto el password
      await newUser.save();                                         //Almaceno el schema guardarndo una nueva fila en la tabla
      req.flash("success_msg", "You are registered.");              //Utilizando flash lo mando a las var globals para que posteriormente renderice con partials el mensaje correspondiente    
      res.redirect("/signin");                                      //Redirecciono al usuario al login
    }
  }
});

router.get("/signin", function(req,res) {                           //Si el usuario ingresa a logearse...
  res.render("user.signin.hbs");                                    //Renderiza el formulario signin
});

//revisar el local async function configurado en ./passport.js para entender el funcionamiento de esta ruta
router.post("/signin", passport.authenticate("local", {             //Si el usuario presiona el boton de login este manda llamar el metodo de autentificacion de passport, dicho metodo es un combinado de las 2 httas "passport", "passport-local" y la configuracion de ./passport.js
  successRedirect: "/notes",                                        //Si el metodo estuvo ok me redirecciona a notes y atravez de las variables globales asigna los datos del usuario indicadole a tosas las rutas que el usuario esta logeado
  failureRedirect: "/signin",                                       //Si el usuario no logro logearse ya que no existe se redirecciona a donde mismo
  failureFlash: true                                                //Si existe un error se coloca failure en true
}));

router.get("/logout",function (req,res) {                           //Si el usuario pulsa el boton logout...
  req.logout();                                                     //Utilizo el motodo de passport para deslogear
  req.flash("success_msg", "You are logged out now.");              //A travez de las variables globales aviso que el usuario se deslogeo
  res.redirect("/signin");                                          //Se redirecciona la pagina a sign in
})

module.exports = router;                                            //Exporto todas las rutas a backend.js

