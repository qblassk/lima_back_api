const bcryptjs = require('bcryptjs');
const { validationResult } = require('express-validator');
const db = require('../src/database/models/index');

const controller = {
   register: (req, res) => {
      return res.render('register');
   },

   processRegister: (req, res) => {
      const resultValidation = validationResult(req);
      if (resultValidation.errors.length > 0) {
         return res.render('register', {
            oldData: req.body,
            errors: resultValidation.mapped(),
         });
      }

      // ------------------------------------------------------------------------------------------- //

      /* let enteredMail = req.body.email;
      const register = async () => {
         try {
            const user = await db.User.findAll({
               where: {
                  email: enteredMail,
               },
            });
            let foundUser = user[0].dataValues.email;

            console.log(foundUser);

            if (enteredMail == foundUser) {
               return res.render('register', {
                  errors: { email: { msg: 'El email ingresado ya existe' } },
                  oldData: req.body,
               });
            }

            if (enteredMail != foundUser) {
               
            }
         } catch (error) {
            console.log('error');
         }
      };
      register();
      */

      // ------------------------------------------------------------------------------------------- //

      let userToCreate = {
         full_name: req.body.full_name,
         email: req.body.email,
         password: bcryptjs.hashSync(req.body.password, 10),
         phone: req.body.phone,
         adress_id: req.body.adress_id,
         user_type_id: req.body.user_type_id,
         avatar: req.file.filename,
      };
      db.User.create(userToCreate);
      return res.redirect('/users/login');
   },

   login: (req, res) => {
      let user = req.body;
      return res.render('login', { user: user });
   },

   loginProcess: (req, res) => {
      let user = req.body;
      const resultValidation = validationResult(req);
      if (resultValidation.errors.length > 0) {
         return res.render('login', {
            user: user,
            errors: resultValidation.mapped(),
         });
      }
      db.User.findAll().then(function (users) {
         let enteredMail = req.body.email;
         for (let i = 0; i < users.length; i++) {
            if (enteredMail == users[i].dataValues.email) {
               let enteredPassword = bcryptjs.compareSync(req.body.password, users[i].password);
               if (enteredPassword) {
                  delete users[i].password;
                  req.session.userLogged = users[i];
                  if (req.body.rememberUser) {
                     res.cookie('userEmail', req.body.email, { maxAge: 1000 * 60 * 60 });
                  }
                  return res.redirect('/users/profile');
               } else {
                  return res.render('login', {
                     errors: { password: { msg: 'La contrase??a es incorrecta' } },
                  });
               }
            }
         }
         return res.render('register', {
            errors: { email: { msg: 'El email ' + enteredMail + ' no est?? registrado' } },
         });
      });
   },

   profile: (req, res) => {
      return res.render('userProfile', {
         user: req.session.userLogged,
      });
   },

   userDetail: (req, res) => {
      return res.render('userDetail', {
         user: req.session.userLogged,
      });
   },

   edit: (req, res) => {
      db.User.findByPk(req.session.userLogged.id).then(function (user) {
         return res.render('userEdit', { user: user });
      });
   },

   update: (req, res) => {
      const resultValidation = validationResult(req);
      if (resultValidation.errors.length > 0) {
         return res.render('userEdit', {
            oldData: req.body,
            user: req.session.userLogged,
            errors: resultValidation.mapped(),
         });
      }

      // hacer verificacion con contrase??a anterior, como requisito,  para poder modificarla

      db.User.update(
         {
            full_name: req.body.full_name,
            email: req.body.email,
            password: bcryptjs.hashSync(req.body.password, 10),
            phone: req.body.phone,
            adress_id: req.body.adress_id,

            // eliminar cuando este creado superusuario
            user_type_id: req.body.user_type_id,

            avatar: req.file.filename,
         },
         {
            where: {
               id: req.session.userLogged.id,
            },
         }
      ).then(function () {
         req.session.userLogged.full_name = req.body.full_name;
         req.session.userLogged.email = req.body.email;
         req.session.userLogged.phone = req.body.phone;
         req.session.userLogged.adress_id = req.body.adress_id;

         // eliminar cuando este creado superusuario
         req.session.userLogged.user_type_id = req.body.user_type_id;

         req.session.userLogged.avatar = req.file.filename;
         return res.redirect('/users/userDetail');
      });
   },

   delete: (req, res) => {
      db.User.destroy({
         where: {
            id: req.session.userLogged.id,
         },
      });
      res.redirect('/');
   },

   logout: (req, res) => {
      res.clearCookie('userEmail');
      req.session.destroy();
      return res.redirect('/');
   },
};

module.exports = controller;
