const express = require('express');
const router = express.Router();
const session = require('cookie-session');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const Lesson = require('../Models/Lessons');
const Tests = require('../Models/Tests');
const Users = require('../Models/Users');
const Lessons = require('../Models/Lessons');
const Answers = require('../Models/Answers');
require('dotenv').config();

// functions

// routes
router.get('/', (req, res) => res.redirect('/teacher/school'))
router.get('/exams', async (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	let lessons = await Lesson.find({ teacher: req.session.user_id })
		.catch(error => console.log(error));
	lessons = typeof lessons[0] !== "undefined" ? lessons : undefined
	return lessons ? res.render('exams', {
		class_id: lessons[0].clas,
		role: req.session.role,
		classes: lessons,
		tests: [],
		AVG: 2.5,
		students: [],
		selected_test: []
	}) : res.redirect("/teacher/exams");
})
router.get('/exams/:id/new', (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	res.render("new_exam", {
		role: req.session.role,
		class_id: req.params.id,
	})
})
router.post('/exams/create', (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	let {title, questions, timout, datetime, id} = {...req.body}
	if(datetime === null){
		datetime = new Date(new Date().getTime()+1000*60*(timout+1)).toISOString().slice(0, 19).replace('T', ' ');
	}
	const test = new Tests({
		name: title,
        lesson: id,
        author: req.session.user_id,
        timout: timout,
        date: datetime,
        template: questions
	})
	test.save().then(() => res.redirect(`/teacher/exams/${id}/${test._id}`))
})
router.get('/exams/:id', async (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	const lessons = await Lessons.find({teacher: req.session.user_id})
	const tests = await Tests.find({lesson: req.params.id})
	const selected_lesson = await Lessons.findByIdAndUpdate(req.params.id)
	console.log(selected_lesson);
	
	res.render('exams', {
		class_id: req.params.id,
		role: req.session.role,
		classes: lessons,
		tests: tests,
		selected_test: [],
		students: selected_lesson.students,
		AVG: selected_lesson.avg
	})
})
router.get('/exams/:id/:test', async (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	const lessons = await Lessons.find({teacher: req.session.user_id}) // classes
	const tests = await Tests.find({lesson: req.params.id})
	const selected_test = await Tests.findById(req.params.test)
	const selected_lesson = await Lessons.findById(req.params.id)
	const clas = await Classes.findById(selected_lesson.clas)
	let answers = await Answers.find({answer_id: req.params.test})
	let AVG_global = 0;
	let AVG_count = tests.length;
	let users_raw = await Users.find({role: 1})

	tests.map(test => {
		AVG_global += test.avg;
		if (test.avg === null)
			AVG_count--;
	})
	const AVG = AVG_global/100/AVG_count;

	let users = clas.students.map(student => {
		for (let i = 0; i < users_raw.length; i++) 
			if(student == users_raw[i]._id.toString())
				return users_raw;
	})
	let modify_users = []; // saving id, name and mark

	users = users.map(user => {
		let have_answer = 0;
		answers.map(answer => answer.author.toString() === user._id.toString() ? 
			have_answer = answer.mark : false)
		modify_users.push({
			id: user._id.toString,
			name: user.name,
			have_answer
		})
	})
	console.log(modify_users);
	res.render('exams', {
		class_id: req.params.id,
		role: req.session.role,
		classes: classes,
		tests: tests,
		students: modify_users,
		selected_test: selected_test,
		AVG: AVG
	})
})
router.get('/school', async (req, res) => {
	let r = req.session;
	if(req.session.role < 2){return res.redirect("/school");}

	let lessons_time = [];
	let lessons = await Lesson.find({"teacher": r.user_id});
	lessons.map(lesson => {
		lesson.time.map(time => {
			lessons_time.push({
				id_class: lesson._id,
				name: lesson.name,
				day: time.day,
				time: time.time
			})
		})
	})
	console.log(lessons_time);
	res.render('school', {
		role: req.session.role,
		title: "MBS - My school",
		lessons_time: lessons_time
	})
})
router.post('/grade/:id/:test', (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	const answers = Answers.find({answer_id: req.params.test});

	let marks = req.body.marks;
	let [marksCount, avg] = [marks.length, 0]
	marks.map(async mark => {
		mark = mark.split('_')
		mark[1] = Number(mark[1]);
		await answers.find({author: mark[0]}).update({mark: mark[1]})
		avg += mark[1];
		marksCount = mark[1] != 0 ? marksCount : marksCount--;
	})
	Tests.findByIdAndUpdate(req.params.test, {avg: all_marks/all_list})

	res.redirect(`/teacher/exams/${req.params.id}/${req.params.test}`);
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
