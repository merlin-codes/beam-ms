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

const auth = (role, max) => {
	if(role >= max){
		return false;
	}else if(role <= max){
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
  let r_auth = auth(req.session.role, 3);
  if(r_auth){res.redirect(r_auth);return;}
  
  if(req.session.level){
    res.redirect(`/root/${req.session.level}`)
  }else{
    res.redirect('/root/users')
  }
})
router.get('/lessons', (req, res)=>{
  let r_auth = auth(req.session.role, 3);
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
  let r_auth = auth(req.session.role, 3);
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
  let r_auth = auth(req.session.role, 3);
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
router.post('/editlesson', (req, res) => {
	let r_auth = auth(req.session.role, 3);
  if(r_auth){res.redirect(r_auth);return;}

  let user = req.body;
  let time = "";
  if(typeof user.time !== 'undefined'){
    for (let index = 0; index < user.time.length; index++) {
      if(index !== 0){
        time += "."
      }
      time += user.time[index];
    }
    delete user.button;
    user.time = time;
  
    if (user.id === '') {
      connection.query("INSERT INTO `lessons`(`name`, `teacher`, `time`) VALUES (?, ?, ?)", [user.name, user.teachername, user.time], (error, result, fields) => {
        if(error){console.log(error);}
        res.redirect(`/root/lesson/${result.insertId}`);
      })
    }else{
      connection.query("UPDATE `lessons` SET `name`=?,`teacher`=?,`time`=? WHERE `id`=?", [user.name, user.teachername, user.time, user.id], (error, result, fields) => {
        if(error){console.log(error);}
        res.redirect(`/root/lesson/${user.id}`)
      })
    }
  }else{
    connection.query("UPDATE `lessons` SET `name`=?, `teacher`=?, time=? WHERE `id`=?", [user.name, user.teachername, "", user.id], (error, result,fields) =>{
      if(error){console.log(error);}
      res.redirect(`/root/lesson/${user.id}`)
    })
  }
})
router.get('/user/:id', (req, res)=>{
	let r_auth = auth(req.session.role, 3);
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
// router.post('/lesson')

router.post('/messenge', (req, res)=>{
  let r_auth = auth(req.session.role, 3);
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
