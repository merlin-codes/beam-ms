const express = require('express');
const router = express.Router();
const session = require('express-session');
const mysql = require('mysql');
require('dotenv').config();

// definitions
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

// routes
router.get('/', (req, res) => {
  res.redirect('/teacher/school')
})

router.get('/exams', (req, res) => {
	if(!req.session.loggedin){
		res.redirect("/login");
	}else if (Number(req.session.role) <= 1) {
		res.redirect("/student");
	}else{
		connection.query(
			"SELECT `id`, `name` FROM `classes` WHERE `teacher`=?",
			[req.session.user_id], (error, result, fields) => {
				let classes = result;
				if (error) {
					console.log(error);
					res.send("We got some problem");
				}else if (classes !== []){
					res.redirect("/teacher/exams/"+classes[0].id);
				}else{
					res.render('exams', {
						role: req.session.role,
						classes: [],
						tests: []
					});
				}
			}
		)
	}
})

router.get('/exams/:id/new', (req, res) => {
	if(!req.session.loggedin){
		res.redirect("/login");
	}else if (Number(req.session.role) <= 1) {
		res.redirect("/student");
	}
	res.render("new_exam", {
		role: req.session.role,
		class_id: req.params.id,
	})
})

router.get('/exams/:id', (req, res) => {
	// users that dont have level of 2++ or is not logged
	if(!req.session.loggedin){
		res.redirect("/login");
	}else if (Number(req.session.role) <= 1) {
		res.redirect("/student");
	}
	connection.query(
		"SELECT `id`, `name` FROM `classes` WHERE `teacher`=?",
		[req.session.user_id], (error, result, fields) => {
			let classes = result;
			connection.query(
				"SELECT * FROM `tests` WHERE `id_class`=?",
				[req.params.id], (error, result, fields) => {
					let tests = result;
					res.render('exams', {
						class_id: req.params.id,
						role: req.session.role,
						classes: classes,
						tests: tests
					})
				}
			)
		}
	)
})

router.get('/school', (req, res) => {
	if(!req.session.loggedin){
		res.redirect("/login");
	}
  let id = req.session.user_id;

	let lessons_time = [];

	console.log(id);
  if(id <= 1){
    res.redirect('/student/school');
  }
	connection.query(
    'SELECT * FROM `classes` WHERE `teacher`=?',
    [id], (error, result, fields) => {
      if(error !== null || result === undefined	){
        console.log(error);
      }
			let classes = result;

			classes.forEach(trida => {
				let time_string = trida.time;
				let times = [];
				// ziska z tridy informaci o case a rozdeli ji do pole
				// kdyz string obsahuje vrati cislo jinak vrati -1 a kod se nespusti
				if(~time_string.indexOf(".")){
					times = time_string.split(".");
				}else{
					times = [time_string];
				}
				times.forEach((time, index) => {
					let timer = time.split("-");
					lessons_time.push({
						id_class: trida.id,
						name: trida.name,
						day: timer[0].toLowerCase(),
						time: Number(timer[1]),
					});
				});
			});
			console.log(lessons_time);
			res.render('school', {
		    role: req.session.role,
		    title: "BMS - My school",
		    lessons_time: lessons_time
		  });
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
