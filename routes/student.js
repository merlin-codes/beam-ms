const express = require('express');
const session = require('cookie-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const Lessons = require('../Models/Lessons');
const Classes = require('../Models/Classes');
require('dotenv').config();

// definitions
const router = express.Router();

// routes
router.get('/', (req, res) => {
  res.redirect("/student/school");
});
router.get('/school', async (req, res) => {
	let s = req.session;
	console.log(s.role);
	console.log(s.user_id);
	console.log(s.loggedin);

	if(!req.session.loggedin){
		res.redirect("/login");
		return;
	}else if (Number(req.session.role) >= 2) {
		console.log("You are teacher");
		res.redirect("/teacher");
		return;
	}
	let classes = await Classes.find();
	classes = classes.filter(clas => {
		let isIncluded = false;
		clas.students.filter(student => student._id === req.session.user_id ? isIncluded = true: false);
		return isIncluded;
	})
	let lessons = [];
	classes.map(async clas => {
		let lessons_raw = await Lessons.find({clas: clas._id});
		lessons_raw.map(lu => lessons.push(lu));
	})

	let times = lessons ? lessons.map(l => {
		l.time.map(t => {
			times.push({
				id_class: l._id,
				name: l.name,
				day: t.day,
				time: t.time
			})
		})
	}) : undefined;
	
	res.render('school', {
		role: req.session.role,
		title: "MBS - My School",
		lessons_time: times
	})
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
