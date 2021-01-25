const express = require('express');
const router = express.Router();
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
require('dotenv').config();

// definitions
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

const auth = (role) => {
	if(role >= 3){
		return false;
	}else if(role <= 3){
		return '/school';
	} else {
		return '/login';
	}
}

// connection -> query
// connection.query("",[],(error, result, fields)=>{})

// req.session.level = lessons or users redirect to last page
// redirect to /lessons or /users

router.get('/', (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  if(req.session.level){
    res.redirect(`/root/${req.session.level}`)
  }else{
    res.redirect('/root/users')
  }
})
router.get('/lessons', (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  req.session.level = "/lessons";
  // if get to lessons
  connection.query(
    "SELECT `id`, `name`, `role` FROM `users`",
    [], (error, result, fields)=>{
      let users = result;
      connection.query(
        "SELECT * FROM `lessons`",[],(error, result, fields)=>{
          if(error){
            console.log(error);
          }
          let lessons = result;
          connection.query(
            "SELECT * FROM `users` WHERE `role`>1",[],(error, result, fields)=>{
              if(error){
                console.log(error);
              }

              let teachers = result;
              lessons.forEach(lesson => {
                teachers.forEach(teacher => {
                  if(teacher.id === lesson.teacher){
                    lesson.teacher_id = teacher.id;
                    lesson.teacher = teacher.name;
                  }
                });
              });
              res.render("lessons", {
                id_user: req.session.user_id,
                role: req.session.role,
                teachers: teachers,
                lessons: lessons,
                selected_lesson: []
              })
            }
          )
        }
      )
    }
  )
})
router.get('/lesson/:id', (req, res)=>{
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}
  
  connection.query("SELECT * FROM `lessons` WHERE `id`=?",[req.params.id],
    (error, result, fields)=>{
      if(error){console.log(error); return;}
      if(result.length > 0){
        let selected_lesson = result[0];
        connection.query("SELECT `id`, `name`, `role` FROM `users`", [], (error, result, fields)=>{
            let users = result;
            connection.query("SELECT * FROM `lessons`",[],(error, result, fields)=>{
                if(error){
                  console.log(error);
                }
                let lessons = result;
                connection.query(
                  "SELECT * FROM `users` WHERE `role`>1",[],(error, result, fields)=>{
                    if(error){
                      console.log(error);
                    }
                    let teachers = result;
                    for (let lesson_i = 0; lesson_i < lessons.length; lesson_i++) {
                      for (let teacher_i = 0; teacher_i < teachers.length; teacher_i++) {
                        if(teachers[teacher_i].id === lessons[lesson_i].teacher){
                          lessons[lesson_i].teacher_id =  teachers[teacher_i].id; 
                          lessons[lesson_i].teacher = teachers[teacher_i].name;
                        }
                      }
                    }
                    for (let index = 0; index < lessons.length; index++) {
                      let timer = [];
                      let times = lessons[index].time.toString().split('.');
                      for (let time = 0; time < times.length; time++) {
                        let timer_raw = times[time  ].toString().split('-');
                        timer.push({
                          day: timer_raw[0],
                          time: Number(timer_raw[1])
                        })
                      }
                      lessons[index].time = timer;
                    }
                    res.render("lessons", {
                      id_user: req.session.user_id,
                      role: req.session.role,
                      teachers: teachers,
                      lessons: lessons,
                      selected_lesson: selected_lesson
                    })
                  }
                )
              }
            )
          }
        )
      }
    }
  );
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
			if (error) { console.log(error); }
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
    if(error){console.log(error);}
    let classes = result;
    connection.query("SELECT * FROM `users`", [], (error, result, fields) => {
      if(error){console.log(error);}
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
    if(error){console.log(error);}
    let classes = result;
    connection.query("SELECT * FROM `user_class` WHERE `id_class`=?", [Number(req.params.id)], (error, result, fields) => {
      console.log(Number(req.params.id));
      let students_in_class = result;
      connection.query("SELECT * FROM `users`", [], (error, result, fields) => {
        if(error){console.log(error);}
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
			if(error){console.log(error);}
			user = undefined;
			res.redirect("/root/users");
			return;
		});
	});
})
router.post('/edituser/:id', (req, res)=>{
	let r_auth = auth(req.session.role, 3);
  if(r_auth){res.redirect(r_auth);return;}
  
	let user = { name: req.body.name, pwd: req.body.pwd, role: req.body.role, email: req.body.email };
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
			[user.name, hash, user.email, user.role, id], (error, result, fields)=>{
				if(error){console.log(error);}
				res.redirect("/root/users");
				return;
			});
		});
	}else{
		connection.query("UPDATE `users` SET `name`=?,`email`=?,`role`=? WHERE `id`=?",
		[user.name, user.email, user.role, id], (error, result, fields)=>{
			if(error){console.log(error);}
			res.redirect("/root/");
			return;
		});
	}
})
router.post('/editlesson', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  console.log("I started...");
  let user = req.body;
  let time = "";
  delete user.button;
  connection.query("SELECT `AUTO_INCREMENT` FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME= 'lessons'", [process.env.DB_NAME], (error,result,fields)=>{
    if(error){console.log(error);}
    user.id = result[0].AUTO_INCREMENT;
    console.log(user.id);
  })

  if(typeof user.id !== 'undefined'){
    connection.query("INSERT INTO `lessons`(`id`, `name`, `teacher`, `time`) VALUES (?, ?, ?)", [user.id, user.name, user.teachername, ""], (error, result, fields) => {
      if(error){console.log(error);}
      res.redirect(`/root/lesson/${result.insertId}`);
    })
  }else{
    for (let index = 0; index < user.time.length; index++) {
      if(index !== 0){
        time += "."
      }
      time += user.time[index];
    }
    user.time = time;
    connection.query("UPDATE `lessons` SET `name`=?, `teacher`=?, time=? WHERE `id`=?", [user.name, user.teachername, user.time, user.id], (error, result,fields) =>{
      if(error){console.log(error);}
      res.redirect(`/root/lesson/${result.insertId}`)
    })
  }
})
router.get('/remove_lesson/:id', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  console.log("i was here.");
  
  connection.query("DELETE FROM `lessons` WHERE `id`=?", [req.params.id], (error, result, fields) => {
    if(error){console.log(error);}
  })
  res.redirect('/root/lessons')
})
router.get('/removeclass/:id', (req, res) => {
  let r_auth = auth(req.session.role);
  if(r_auth){res.redirect(r_auth);return;}

  let id = Number(req.params.id);

  connection.query('DELETE FROM `classes` WHERE `id`=?',[id], (error, result, fields) => {
    if(error){console.log(error);}
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
    if(error){console.log(error);}
    for (let index = 0; index < students.length; index++) {
      connection.query("INSERT INTO `user_class`(`id_user`, `id_class`) VALUES (?,?)", [Number(students[index]), req.params.id], (error, result, fields) => {
        if(error){console.log(error);}
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
    if(error){console.log(error);}
  })
  connection.query("DELETE FROM `user_class` WHERE `id_class`=?", [req.params.id], (error, result, fields) => {
    if(error){console.log(error);}
  })
  for (let index = 0; index < students.length; index++) {
    connection.query("INSERT INTO `user_class`(`id_user`, `id_class`) VALUES (?,?)", [Number(students[index]), req.params.id], (error, result, fields) => {
      if(error){console.log(error);}
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
    if(error){console.log(error);}
    res.redirect('/root/');
	})
})

// redirect to index controller
router.get('/login', (req, res)=>{
  res.redirect("/login")
})
router.get('/logout', (req, res) => {
  res.redirect('/logout')
})
router.get('/register', (req, res)=>{
  res.redirect("/register")
})

module.exports = router;
