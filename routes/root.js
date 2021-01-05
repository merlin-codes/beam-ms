const express = require('express');
const router = express.Router();
const session = require('express-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
require('dotenv').config();
const bcrypt = require('bcrypt');

// definitions
const basicDefence = (role, who) => {
	if(Number.isInteger(role)){
		if(role === who || who === 10){
			return;
		}else{
			return false;
		}
	}else{
		return "/login";
	}
}
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

// routes to pages
router.get('/', (req, res)=>{
	let defence =  basicDefence(req.session.role, 3);
	if(defence){res.redirect(defence);}
  // level = false for user, true for lessons
	let level = req.session.level;
  if(level){
    res.redirect(`/root/${level}`);
  }else{
    res.redirect("/root/users");
  }
})
// lessons pages
router.get('/lessons', (req, res)=>{
	let defence = basicDefence(req.session.role, 3);
	if(defence){res.redirect(defence);}
  req.session.level = "lessons";
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
                    lesson.teacher = teacher.name
                  }
                });
              });

              res.render("lessons", {
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
  if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}else if (Number(req.session.role) <= 1) {
		res.redirect("/student");
		return;
	}
  connection.query("SELECT * FROM `lessons` WHERE `id`=?",[req.params.id],
    (error, result, fields)=>{
      if(error){console.log(error); return;}
      if(result.length > 0){
        console.log(result);
        let selected_lesson = result[0];
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
                          lesson.teacher = teacher.name
                        }
                      });
                    });

                    res.render("lessons", {
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
// classes pages
router.get('/classes/', (req, res)=>{
	let defence = basicDefence(req.session.role, 3);
	if(defence){res.redirect(defence);}
	req.session.level = "/classes";
	connection.query('SELECT * FROM `classes`',[],(error, result, fields)=>{
		let classes = result;
		classes.forEach((trida, i) => {
			connection.query("SELECT * FROM `users` WHERE `id`=?", [trida.mainTeacher], (error, result, fields)={
				trida.mainTeacher = result[0].name;
			})
			if(trida.length-1 === i){
				res.render('classes', {
					role: req.session.role,
					classes: classes,
					students: []
				})
			}
		});

	})
})


// users pages
router.get('/users', (req, res)=>{
  if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}
  if(req.session.user_id <= 2){
    res.redirect('/student/school');
		return;
  }
  req.session.level = false;
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
	if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}
  if(req.session.user_id <= 2){
    res.redirect('/student/school');
		return;
  }
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
router.post('/edituser', (req, res)=>{
	if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}
	if(!req.session.role >= 3){
		res.redirect("/school");
		return;
	}
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
	console.log(req.params.id);
	let id = req.params.id;
	if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}
	if(!req.session.role >= 3){
		res.redirect("/school");
		return;
	}
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
router.post('/messenge', (req, res)=>{
	let msg = req.body.msg;
	let id = req.session.user_id;
	connection.query("INSERT INTO `msg`(`id_user`, `content`) VALUES (?, ?)",[id, msg],(error, result, fields)=>{
		if(error){console.log(error);}
		res.redirect("/root")
	});
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
