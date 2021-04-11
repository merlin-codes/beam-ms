const express = require('express');
const session = require('cookie-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const Lessons = require('../Models/Lessons');
const Classes = require('../Models/Classes');
require('dotenv').config();

// definitions
const router = express.Router();

function getLessonsToTime(lessons) {
	let returner = new Array();
	for (let i = 0; i < lessons.length; i++) {
		let lesson_time = lessons[i].time.map(t => {return {id_class: lessons[i]._id.toString(), name: lessons[i].name, day: t.day, time: t.time}})
		if(i === 0){
			returner = lesson_time
		}else{
			returner = returner.concat(lesson_time)
		}
	}
	return returner;
}

// routes
router.get('/', (req, res) => {
  res.redirect("/student/school");
});
router.get('/school', async (req, res) => {
	let s = req.session;
	if(s.role !== 1) {res.redirect('/school'); return;}

	let classes = await Classes.find();
	classes = classes.filter(clas => {
		let isIncluded = false;
		clas.students.map(student => student === req.session.user_id ? isIncluded = true: false);
		return isIncluded;
	});
	let lessons = new Array();
	if(classes.length < 2) lessons = await Lessons.find({clas: classes[0]._id.toString()})
	else
		for (let i = 0; i < classes.length; i++) {
			lessons_raw = await Lessons.find({ clas: classes[i]._id.toString() });
			if(i === 0) lessons = lessons_raw;
			else lessons = lessons.concat(lessons_raw);
		}
	
	let times = !lessons ? [] : getLessonsToTime(lessons)
	console.log(times);
	res.render('school', {
		role: req.session.role,
		title: "MBS - My School",
		lessons_time: times
	})
});
router.get('/marks', async (req, res) => {
	if(req.session.role !== 1) {res.redirect('/school'); return;}

	let classes = await Classes.find()
	let lessons = [];
	classes.filter(clas => {
		let isInclude = false;
		clas.students.map(student => req.session.user_id === student ? isInclude = true : false)
		return isInclude;
	}).map( async (clas, i) => {
		lessons.concat(await Lessons.find({clas: clas._id.toString()}))
	})
	console.log(lessons);

	if(req.session.role === 1){
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
