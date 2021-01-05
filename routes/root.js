const express = require('express');
const router = express.Router();
const session = require('express-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
require('dotenv').config();

// definitions
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});
// connection -> query
// connection.query("",[],(error, result, fields)=>{})

// req.session.level = lessons or users redirect to last page
// redirect to /lessons or /users
router.get('/', (req, res)=>{
  if(req.session.role <= 2){
    res.redirect("/school");
  }
  // level = false for user, true for lessons
  if(req.session.level){
    res.redirect("lessons");
  }else{
    res.redirect("users");
  }
})
router.get('/lessons', (req, res)=>{
  if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}
  if(req.session.user_id <= 2){
    res.redirect('/student/school');
		return;
  }
  req.session.level = true;
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
      })
    }
  )
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
