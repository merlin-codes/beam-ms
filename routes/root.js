const express = require('express');
const router = express.Router();
const session = require('cookie-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const Lessons = require('../Models/Lessons');
const Classes = require('../Models/Classes');
const Users = require('../Models/Users');
const MSGs = require('../Models/MSGs')
require('dotenv').config();

const auth = (role) => role > 2 ? false : true;
// helping function
// get lesson

// routes 
router.get('/', (req, res) => req.session.level ? res.redirect(`/root${req.session.level}`): res.redirect('/root/lessons'))
router.get('/lessons', async (req, res) => {
  let s = req.session;
  if(auth(s.role, 3)){res.redirect('/school');return;}
  s.level = "/lessons";

  const classes = await Classes.find();
  const teachers = await Users.find({$or: [{role: 2}, {role: 3}]});
  let lessons = await Lessons.find();

  res.render("lessons", {
    id_user: s.user_id,
    role: s.role,
    teachers: teachers,
    lessons: lessons,
    classes: classes,
    selected_class: [],
    selected_lesson: []
  })
});
// uncompleted
router.get('/lesson/:id', async (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  let selected_lesson = await Lessons.find({"_id": req.params.id});
  let lessons = await Lessons.find();
  let classes_raw = await Classes.find();
  let selected_class = await Classes.findOne({"_id": req.params.id});
  let teachers = await Users.find({$or: [{"role": 2}, {"role": 3}]})
  
  classes = [];
  if(classes_raw){
    for (let i = 0; i < classes_raw.length; i++) {
      classes.push({
        id: classes_raw[i].id,
        name: classes_raw[i].name+" - "+ classes_raw[i].mainTeacher
      })
    }
  }
  lessons.map(lesson => teachers.map(teacher => {
    lesson.teachername = teacher.name;
  }))
  res.render("lessons", {
    id_user: req.session.user_id,
    role: req.session.role,
    teachers: teachers,
    lessons: lessons,
    classes: classes,
    selected_class: selected_class,
    selected_lesson: selected_lesson[0]
  })
})
router.get('/users', async (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  req.session.level = "/users";

  let users = await Users.find();
  res.render("users", {
    role: req.session.role,
    users: users,
    selected_user: []
  })
})
router.get('/user/:id', async (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  let users = await Users.find()
  let user = await Users.find({"_id": req.params.id})
  res.render('users', {
    role: req.session.role,
    users: users,
    selected_user: user[0]
  });
})
// uncompleted
router.get('/classes', async (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  let classes 
  
  connection.query("SELECT * FROM `classes`", [], (error, result, fields) => {
    if(error)throw error;
    let classes = result;
    connection.query("SELECT * FROM `users`", [], (error, result, fields) => {
      if(error)throw error;
      let teachers = [];
      let students = [];
      for (let index = 0; index < result.length; index++) {
        if(result[index].role > 1){
          teachers.push(result[index]);
        }else{
          students.push(result[index]);
        }
      }
      for (let index = 0; index < classes.length; index++) {
        for (let i = 0; i < teachers.length; i++) {
          if(teachers[i].id === classes[index].mainTeacher){
            classes[index].teacher = teachers[i].name;
          }
        }
      }
      res.render('classes', {
        role: req.session.role,
        classes: classes,
        teachers: teachers,
        students: students,
        selected_class: []
      })
    })
  })
})
router.get('/class/:id', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  connection.query("SELECT * FROM `classes`", [], (error, result, fields) => {
    if(error)throw error;
    let classes = result;
    connection.query("SELECT * FROM `user_class` WHERE `id_class`=?", [Number(req.params.id)], (error, result, fields) => {
      console.log(Number(req.params.id));
      let students_in_class = result;
      connection.query("SELECT * FROM `users`", [], (error, result, fields) => {
        if(error)throw error;
        let teachers = [];
        let students = [];
        let selected_class;
        for (let index = 0; index < result.length; index++) {
          if(result[index].role > 1){
            teachers.push(result[index]);
          }else{
            students.push(result[index]);
          }
        }
        console.log(typeof students_in_class);
        if(typeof students_in_class !== 'undefined'){
          for (let index = 0; index < students.length; index++) {
            let userNotInclude = false;
            for (let jndex = 0; jndex < students_in_class.length; jndex++) {
              if (students[index].id === students_in_class[jndex].id_user) {
                userNotInclude = true;
              }
            }
            students[index].selIn = userNotInclude;
          }
        }
        for (let index = 0; index < classes.length; index++) {
          for (let i = 0; i < teachers.length; i++) {
            if(teachers[i].id === classes[index].mainTeacher){
              classes[index].teacher = teachers[i].name;
            }
          }
          if(classes[index].id === Number(req.params.id)){
            selected_class = classes[index];
          }
        }
        if(typeof selected_class === 'undefined'){ res.redirect('/root/classes'); return; }
        res.render('classes', {
          role: req.session.role,
          classes: classes,
          teachers: teachers,
          students: students,
          selected_class: selected_class
        })
      })
    })
  })
})

// edit datas
router.post('/edituser', (req, res) => {
  if(auth(req.session.role)){res.redirect("/school");return;}
  let {name, email, role, pwd, id} = {...req.body}
  role = role == "teacher" ? role = 2: role == "principal" ? 3:1

	if (id === "")
    bcrypt.hash(pwd, 10, (err, hash)=>{
      let user = new Users({
        'name': name,
        'role': role,
        'email': email,
        'class': null,
        'pwd': hash
      })
      user.save().then(()=> {
        res.redirect(`/root/users/${user._id}`);
        return;
      })
    });
  let updatedData = {"name":name, "email":email, "role":role}
  if(pwd !== "")
    updatedData.pwd = pwd
  Users.updateOne({"_id":id}, updatedData).then(() => res.redirect(`/root/user/${id}`))
})

router.post('/editlesson', (req, res) => {
  if(auth(req.session.role)){res.redirect('/school'); return;}
  let {name, teachername, id, time, clas} = {...req.body};
  console.log(`${name}, ${teachername}, ${id}, ${time}, ${clas}`);
  if (id === '') {
    new Lessons({
      "name": name,
      "teacher": teachername,
      "time": [],
      "clas": clas,
      "students": []
    }).save().then(() => res.redirect(`/root/lesson/${lesson._id}`))
  } else {
    time = time.map(t => {t = t.split('-');return {day: t[0], time: t[1]}})
    Lessons.updateOne({"_id":id}, {"name":name, "teacher":teachername, "clas":clas, "time":time})
      .then(() => res.redirect(`/root/lesson/${id}`))
  }
})

router.get('/remove_lesson/:id', (req, res) => {
  if(auth(req.session.role)){res.redirect('/school'); return;}
  Lessons.findOneAndDelete({"_id":req.params.id}, () => {res.redirect('/root/lessons')})
})

router.get('/removeclass/:id', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  let id = Number(req.params.id);

  connection.query('DELETE FROM `classes` WHERE `id`=?',[id], (error, result, fields) => {
    if(error)throw error;
    res.redirect("/root/classes");
  })
})

router.post('/editclass', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  let name = req.body.name;
  let teacher = Number(req.body.teacher);
  let students = req.body.students;

  // add item to classes
  connection.query("INSERT INTO `classes`(`name`, `mainTeacher`) VALUES (?,?)",[name, teacher],(error, result, fields) => {
    if(error)throw error;
    for (let index = 0; index < students.length; index++) {
      connection.query("INSERT INTO `user_class`(`id_user`, `id_class`) VALUES (?,?)", [Number(students[index]), req.params.id], (error, result, fields) => {
        if(error)throw error;
      })
    }
    res.redirect('/root/classes');
  })
})

router.post('/editclass/:id', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  console.log(req.body);

  let name = req.body.name;
  let teacher = Number(req.body.teacher);
  let students = req.body.students;

  // add item to classes
  connection.query("UPDATE `classes` SET `name`=?,`mainTeacher`=? WHERE `id`=?",[name, teacher, req.params.id],(error, result, fields) => {
    if(error)throw error;
  })
  connection.query("DELETE FROM `user_class` WHERE `id_class`=?", [req.params.id], (error, result, fields) => {
    if(error)throw error;
  })
  for (let index = 0; index < students.length; index++) {
    connection.query("INSERT INTO `user_class`(`id_user`, `id_class`) VALUES (?,?)", [Number(students[index]), req.params.id], (error, result, fields) => {
      if(error)throw error;
    })
  }
  res.redirect(`/root/class/${req.params.id}`);
})
router.post('/messenge', (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  new MSGs({
    "author": req.session.user_id,
    "content": req.body.messenge 
  }).save().then(err => {
    if(err) console.log(err);
    res.redirect('/root/users');
  })
})

// redirect to index controller
router.get('/login', (req, res) => res.redirect("/login"))
router.get('/logout', (req, res) => res.redirect('/logout'))
router.get('/register', (req, res) => res.redirect("/register"))

module.exports = router;
