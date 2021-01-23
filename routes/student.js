const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
require('dotenv').config();

// definitions
const router = express.Router();
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

// routes
router.get('/', (req, res) => {
  res.redirect("/student/school");
});
router.get('/school', (req, res) => {
	if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}else if (Number(req.session.role) >= 2) {
		console.log("You are teacher");
		res.redirect("/teacher");
		return;
	}
	let lessons = [];
	let lessons_time = [];

	// get all lessons where is student
	connection.query("SELECT * FROM `user_lesson` WHERE `id_user`=?",
	[req.session.user_id],(error, result, fields)=>{
		if(error){
			console.log(error);
			res.send("something bad is going on. It this error showed you for lot of time send email to >> or just go ...");
			return;
		}
		let lessons_id = result;
		// res.send("user lesson working")
		lessons_id.forEach((item, i) => {
			// get lessons by lessons_id
			connection.query("SELECT * FROM `lessons` WHERE `id`=?",[item.id_class],(error, result, fields)=>{
				if(error){
					console.log(error);
				}
				lessons.push(result[0]);
				if(i+1 === lessons_id.length){
					// now i have all lessons
					lessons.forEach((clas, index) => {
						let time = clas.time;
						if(time.includes('.')){
							time = time.split('.');
						}else{
							time = [time];
						}
						time.forEach((data, index2) => {
							let timer = data.split('-');
							lessons_time.push({
								id_class: clas.id,
								name: clas.name,
								day: timer[0].toLowerCase(),
								time: Number(timer[1])
							});
							if (index2+1 === time.length && lessons.length === index+1) {
								res.render('school', {
									role: req.session.role,
									title: "MBS - My school",
									lessons_time: lessons_time,
								});
								return;
							}
						});
					});
				}
			});
		});
	});
});
router.get('/marks', (req, res) => {
  if(!req.session.loggedin){
    res.redirect("/login");
  }
  if(Number(req.session.role) === 1){
    res.render('mark', {
      title: "MBS - my schoool",
      role: req.session.role
    });
  }else{
    res.render('mark', {
      title: "MBS - my schoool",
      role: req.session.role
    });
  }
});

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
