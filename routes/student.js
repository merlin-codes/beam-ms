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
function getLessonsByStudent(student_id) {
	return new Promise(async (resolve, reject) => {
		let classes = await Classes.find();
		let lessons = new Array();
		classes = classes.filter(
			clas => typeof clas.students.filter(student => student === student_id)[0] !== "undefined"
		);
		for (let i = 0; i < classes.length; i++)
			lessons = lessons.concat(await Lessons.find({ clas: classes[i]._id.toString() }));
		resolve(lessons)
	})
}

// routes
router.get('/', (req, res) => {
  res.redirect("/student/school");
});
router.get('/school', async (req, res) => {
	let s = req.session;
	if(s.role !== 1) {res.redirect('/school'); return;}
	let lessons = await getLessonsByStudent(req.session.user_id);
	let times = lessons ? getLessonsToTime(lessons) : [];
	res.render('school', {
		role: req.session.role,
		title: "MBS - My School",
		lessons_time: times
	})
});
router.get('/marks', async (req, res) => {
	if(req.session.role !== 1) {res.redirect('/school'); return;}

	let lessons = await getLessonsByStudent(req.session.user_id);

	res.render('mark', {
		title: "MBS - my schoool",
		role: req.session.role,
		lessons: lessons
	});
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
