const express = require('express');
const session = require('express-session');
const mysql = require('mysql');

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
  res.redirect("/school");
});

router.get('/school', (req, res) => {
	if(!req.session.loggedin){
    res.redirect("/login");
  }else{
		let role = req.session.role;
		let id = req.session.id;

		if(req.session.role != 1){
			console.log("You are not student")
			res.redirect("/teacher");
		}else{
			let classes = [];
			let lessons_time = [];

			connection.query(
				'SELECT * FROM `class_student` WHERE `id_user`=?',
				[id], (error, result, fields) => {
					if(!result){
						result.forEach(item => {
							connection.query(
								'SELECT * FROM `classes` WHERE `id`=?',
								[item.id_class], (error, result, fields) => {
									classes.push(result[0]);
								}
							);
						});
					}
					classes.forEach( clas => {
						let time = item.time;
						if(time.includes('.')){
							time = time.replace(' ', '').split('.');
						}else{
							time = [time];
						}
						time.forEach(item => {
							let timer = time.split('-');
							lessons_time.push({
								id_class: clas.id,
								name: clas.name,
								day: timer[0].toLowerCase(),
								time: Number(timer[1])
							});
						});
					});
					connection.end();
					res.render('school', {
						role: role,
						title: "BMS - My school",
						lessons_time: lessons_time,
					});
				}
			);
		}
	}
});

router.get('/marks', (req, res) => {
	if(!req.session.loggedin){
    res.redirect("/login");
  }
  if(Number(req.session.role)  === 1){
    res.render('mark', {
      title: "BEAM - my schoool",
      role: req.session.role
    });
  }else{
    res.render('mark', {
      title: "BEAM - my schoool",
      role: 0
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
