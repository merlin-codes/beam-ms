const express = require('express');
const router = express.Router();
const session = require('cookie-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const Lessons = require('../Models/Lessons');
const Classes = require('../Models/Classes');
const Users = require('../Models/Users');
require('dotenv').config();

const auth = (role) => role >= 3 ? false: true;
// helping function
// get lesson

// routes 
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
router.get('/users', (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  req.session.level = "/users";
  connection.query(
    "SELECT `id`, `name`, `role` FROM `users`",
    [], (error, result, fields)=>{
      let users = result;
      res.render("users", {
        role: req.session.role,
        users: users,
				selected_user: []
      })
    }
  )
})
router.get('/user/:id', (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
	connection.query("SELECT `id`, `name`,`role` FROM `users`",[],(error, result, fields)=>{
		let users = result;
		connection.query("SELECT * FROM `users` WHERE `id`=?",[req.params.id],(error, result, fields)=>{
			let selected_user = result[0];
			if (error) { throw error; }
			else if (selected_user === []) {
				res.redirect("/root/users");
				return;
			}
			// send data to template
			res.render('users', {
        role: req.session.role,
        users: users,
				selected_user: selected_user
			});
		});
	});
})
router.get('/classes', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
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
router.post('/edituser', (req, res)=>{
	let r_auth = auth(req.session.role, 3);
  if(r_auth){res.redirect(r_auth);return;}
  
	let user = {
		name: req.body.name,
		pwd: req.body.pwd,
		role: req.body.role,
		email: req.body.email,
	};
	if(user.role === "teacher"){
		user.role = 2;
	}else if(user.role === "principal"){
		user.role = 3;
	}else if(user.role === "student"){
		user.role = 1;
	}

	bcrypt.hash(user.pwd, 10, (err, hash)=>{
		connection.query("INSERT INTO `users`(`name`, `pwd`, `email`, `role`) VALUES (?, ?, ?, ?)",
		[user.name, hash, user.email, user.role], (error, result, fields)=>{
			if(error)throw error;
			user = undefined;
			res.redirect("/root/users");
			return;
		});
	});
})
router.post('/edituser/:id', (req, res)=>{
	let r_auth = auth(req.session.role, 3);
  if(r_auth){res.redirect(r_auth);return;}
  
	let user = { name: req.body.name, pwd: req.body.pwd, role: req.body.role, email: req.body.email, id: req.params.id };
	if(user.role === "teacher"){
		user.role = 2;
	}else if(user.role === "principal"){
		user.role = 3;
	}else if(user.role === "student"){
		user.role = 1;
	}
	// hash password or not change password
	if(user.pwd !== ""){
		bcrypt.hash(user.pwd, 10, (err, hash)=>{
			connection.query("UPDATE `users` SET `name`=?,`pwd`=?,`email`=?,`role`=? WHERE `id`=?",
			[user.name, hash, user.email, user.role, user.id], (error, result, fields)=>{
				if(error)throw error;
				res.redirect("/root/users");
				return;
			});
		});
	}else{
		connection.query("UPDATE `users` SET `name`=?,`email`=?,`role`=? WHERE `id`=?",
		[user.name, user.email, user.role, user.id], (error, result, fields)=>{
			if(error)throw error;
			res.redirect("/root/");
			return;
		});
	}
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
    time = time.map(tim => {tim = tim.split('-');return {day: tim[0], time: tim[1]}})
    console.log(time);

    // time.map(time1 => {
    //   let x = time1.split("-");
    //   time_local.push({
    //     day: time1[0],
    //     time: time1[1]
    //   });
    // });
    Lessons.updateOne({"_id":id}, {"name":name, "teacher":teachername, "clas":clas, "time":time})
      .then(() => res.redirect(`/root/lesson/${id}`))
  }
})
router.get('/remove_lesson/:id', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth); return;}
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

// router.post('/lesson')
router.post('/messenge', (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  let msg = req.body.messenge;
	let id = req.session.user_id;
	connection.query("INSERT INTO `msg`(`id_user`, `content`) VALUES (?, ?)",[id, msg],(error, result, fields)=>{
    if(error)throw error;
    res.redirect('/root/');
	})
})

// redirect to index controller
router.get('/login', (req, res) => res.redirect("/login"))
router.get('/logout', (req, res) => res.redirect('/logout'))
router.get('/register', (req, res) => res.redirect("/register"))

module.exports = router;
