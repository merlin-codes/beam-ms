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

const auth = (role, max) => {
	if(role >= max){
		return false;
	}else if(role <= max){
		return '/school';
	} else {
		return '/login';
	}
}

// routes
router.get('/', (req, res) => {
  res.redirect('/teacher/school')
})
router.get('/exams', (req, res) => {
	let r_auth = auth(req.session.role, 2);
	if(r_auth){res.redirect(r_auth);return;}

	connection.query(
		"SELECT `id`, `name` FROM `lessons` WHERE `teacher`=?",
		[req.session.user_id], (error, result, fields) => {
			let classes = result;
			if (error) {
				console.log(error);
				res.send("We got some problem");
			}else if (classes !== []){
				res.redirect("/teacher/exams/"+classes[0].id);
			}else{
				res.render('exams', {
					class_id: req.params.id,
					role: req.session.role,
					classes: [],
					tests: [],
					selected_test: [],
					students: []
				});
			}
		}
	)
})
router.get('/exams/:id/new', (req, res) => {
	let r_auth = auth(req.session.role, 2);
	if(r_auth){res.redirect(r_auth);return;}

	res.render("new_exam", {
		role: req.session.role,
		class_id: req.params.id,
	})
})
router.post('/exams/:id/create', (req, res) => {
	let r_auth = auth(req.session.role, 2);
	if(r_auth){res.redirect(r_auth);return;}

	// let title = req.body.title;
	// let id = req.params.id;
	// let question = req.body.question;
	// let answer = req.body.answer;
	// let correct = req.body.correct;
	// let datetime = req.body.date+" "+req.body.time+":00";



	// if(id === "" || title === "" || question === "" || answer === "" ||correct === "" || datetime === ""){
	// 	res.redirect("/teacher/exams/"+id+"/new");
	// }else{
	// 	connection.query(
	// 		"INSERT INTO `tests`(`time`, `name`, `question`, `correct_answer`, `answer`, `id_class`) VALUES (?, ?, ?, ?, ?, ?)",
	// 		[datetime, title, question, correct, answer, id], (error, result, fields) => {
	// 			if (error) {
	// 	      return connection.rollback(function() {
	// 	        throw error;
	// 	      });
	// 	    }
	// 			res.redirect("/teacher/exams/"+id);
	// 		}
	// 	)
	// }
})
router.get('/exams/:id', (req, res) => {
	let r_auth = auth(req.session.role, 2);
	if(r_auth){res.redirect(r_auth);return;}

	connection.query(
		"SELECT `id`, `name` FROM `lessons` WHERE `teacher`=?",
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
						tests: tests,
						selected_test: [],
						students: []
					})
				}
			)
		}
	)
})
router.get('/exams/:id/:test', (req, res) => {
	let r_auth = auth(req.session.role, 2);
	if(r_auth){res.redirect(r_auth);return;}

	connection.query(
		"SELECT `id`, `name` FROM `lessons` WHERE `teacher`=?",
		[req.session.user_id], (error, result, fields) => {
			let classes = result;
			if(error){
				console.log(error);
			}else if (result.length > 0) {
				connection.query(
					"SELECT * FROM `tests` WHERE `id_class`=?",
					[req.params.id], (error, result, fields) => {
						tests = result;
						let selected_test = [];
						let endeslust = true;
						tests.forEach((test, index) => {
							if(test.id == req.params.test){
								selected_test = test;
								endeslust = false;
							}
							if(tests.length === index+1){
								if(endeslust){
									res.redirect("/teacher/exams/"+req.params.id);
									return;
								}else{
									connection.query(
										"SELECT * FROM `user_lesson` WHERE `id_class`=?",
										[req.params.id],(error, result, fields) => {
											let users = result;
											let modify_users = [];
											let counter = 0;
											users.forEach((user, index)=>{
												connection.query(
													"SELECT `id`, `name`, `role` FROM `users` WHERE `id`=?",
													[user.id_user],(error, result, fields) => {
														modify_users.push({
															id: result[0].id,
															name: result[0].name
														});
														if(users.length === index+1){
															res.render("exams", {
																class_id: req.params.id,
																role: req.session.role,
																classes: classes,
																tests: tests,
																students: modify_users,
																selected_test: selected_test
															});
														}
													}
												);
											});
										}
									)
								}
							}
						});
					}
				)
			}else{
				res.redirect("/exams");
			}
		}
	)
})
router.get('/school', (req, res) => {
	let r_auth = auth(req.session.role, 2);
	if(r_auth){res.redirect(r_auth);return;}
	
	let lessons_time = [];

	connection.query('SELECT * FROM `lessons` WHERE `teacher`=?',[id], (error, result, fields) => {
		if(error){console.log(error);}
		let classes = result;
		for (let index = 0; index < classes.length; index++) {
			let trida = classes[index];
			let time_string = trida.time, times = [];
			if(~time_string.indexOf(".")) {
				times = time_string.split(".");
			}else{
				times = [timer_string];
			}
			for (let i = 0; i < times.length; i++) {
				let timer = times[i].split("-");
				lessons_time.push({
					id_class: trida.id,
					name: trida.name,
					day: timer[0].toLowerCase(),
					time: Number(timer[1])
				})				
			}
			
		}
		res.render('school', {
			role: req.session.role,
			title: "BMS - My school",
			lessons_time: lessons_time
		});
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
