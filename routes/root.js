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
  if(auth(req.session.role)){res.redirect('/school');return;}
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
  if(auth(req.session.role)){res.redirect("/school");return;}
  
  let selected_lesson = await Lessons.find({"_id": req.params.id});
  let lessons = await Lessons.find();
  let classes = await Classes.find();
  let selected_class;
  let teachers = await Users.find({$or: [{"role": 2}, {"role": 3}]})
  
  classes = classes.map(clas => {
    let name = ""
    teachers.map(teacher => teacher._id.toString() === clas.teacher ? name = teacher.name: false)
    clas.teacher_name = name;
    if(selected_lesson[0].clas === clas._id.toString())
      selected_class = clas;
    return clas;
  })
  lessons = lessons.map(lesson => {
    let teacher_name = "";
    teachers.map(teacher => lesson.teacher.toString() === teacher._id.toString() ? teacher_name = teacher.name : false);
    lesson.teacher_name = teacher_name;
    return lesson;
  })
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
  req.session.level = "/classes";

  let classes = await Classes.find();
  let users = await Users.find();
  let students = users.filter(u => u.role === 1);
  let teachers = users.filter(u => u.role !== 1);
  classes = classes.map(clas => {
    teachers.map(teacher => {
      if(teacher._id.toString() === clas.teacher.toString()) clas.teacher_name = teacher.name; 
    })
    return clas;
  })
  res.render('classes', {
    role: req.session.role,
    classes: classes,
    teachers: teachers,
    students: students,
    selected_class: []
  })
})
router.get('/class/:id', async (req, res) => {
  if(auth(req.session.role)){res.redirect(r_auth);return;}

  let classes = await Classes.find();
  const users = await Users.find();
  let teachers = users.filter(u => u.role !== 1);
  let students = users.filter(u => u.role === 1);
  let selected_class = await Classes.findById(req.params.id);
  students = students.map(student => {
    let selIn = false 
    selected_class.students.map(s => student._id.toString() === s.toString() ? selIn = true: false)
    student.selIn = selIn;
    return student;
  })
  classes = classes.map(clas => {
    let teacher_name = "";
    teachers.map(teacher => {
      console.log(teacher._id.toString() == clas.teacher.toString() ? teacher_name = teacher.name: false);
      return teacher._id.toString() === clas.teacher.toString() ? teacher_name = teacher.name: false
    });
    clas.teacher_name = teacher_name;
    console.log(clas);
    return clas;
  })
  if(typeof selected_class === 'undefined'){ return res.redirect('/root/classes'); }
  res.render('classes', {
    role: req.session.role,
    classes: classes,
    teachers: teachers,
    students: students,
    selected_class: selected_class
  });
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
        res.redirect(`/root/user/${user._id}`);
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
    let lesson = new Lessons({
      "name": name,
      "teacher": teachername,
      "time": [],
      "clas": clas,
      "students": []
    })
    lesson.save().then(() => res.redirect(`/root/lesson/${lesson._id}`))
  } else {
    time = time.map(t => {t = t.split('-');return {day: t[0], time: t[1]}})
    Lessons.updateOne({"_id":id}, {"name": name, "teacher": teachername, "clas": clas, "time": time})
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
  
  Classes.findByIdAndRemove(req.params.id).then(() => res.redirect(/root/classes))
})

router.post('/editclass', async (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  let {name, teacher, students = [], id = ""} = {...req.body}
  console.log(`${name}, ${teacher}, ${students}, ${id}`);

  if(id === ''){
    let clas = new Classes({
      'name': name,
      'teacher': teacher,
      'students': students,
      'avg': 0,
    })
    await clas.save()
    res.redirect(`/root/class/${clas._id}`);
    return;
  }
  let clas = await Classes.findById(id)
  await clas.update({
    'name': name,
    'teacher': teacher,
    'students': students
  })
  res.redirect(`/root/class/${clas._id}`);
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
