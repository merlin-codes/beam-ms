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
const Classes = require('../Models/Classes');
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

	let {title, datetime, timout, questions, id} = {...req.body}
	if(datetime === null){
		datetime = new Date(new Date().getTime()+1000*60*(timout+1)).toISOString().slice(0, 19).replace('T', ' ');
	}
	const test = new Tests({
		name: title,
        lesson: id,
        author: req.session.user_id,
        timout: timout,
        date: datetime,
        template: questions,
		avg: 0,
	})
	test.save().then(() => res.redirect(`/teacher/exams/${id}/${test._id}`))
})
router.get('/exams/:id', async (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	const lessons = await Lessons.find({teacher: req.session.user_id})
	const tests = await Tests.find({lesson: req.params.id})
	const selected_lesson = (await Lessons.find({_id: req.params.id}))[0]
	const selected_clas = selected_lesson != null ? await Classes.findById(selected_lesson.clas) : null;
	const students_raw = await Users.find({role: 1});

	let students = new Array();
	if(selected_clas){
		students = selected_clas.students.map(student => {
			let returner = "";
			students_raw.map(student_raw => student === student_raw._id.toString() ? returner = student_raw: false)
			return returner;
		});
	}

	res.render('exams', {
		class_id: req.params.id,
		role: req.session.role,
		classes: lessons,
		tests: tests,
		selected_test: [],
		selected_lesson: selected_lesson,
		students: students,
		AVG: selected_lesson.avg
	})
})
router.get('/exams/:id/:test', async (req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	const lessons = await Lessons.find({teacher: req.session.user_id}) // classes
	const tests = await Tests.find({lesson: req.params.id})
	const selected_test = await Tests.findById(req.params.test)
	const selected_lesson = await Lessons.findById(req.params.id)
	const clas = (await Classes.find({_id: selected_lesson.clas}))[0]
	let answers = await Answers.find({answer_id: req.params.test})
	let AVG_global = 0;
	let AVG_count = tests.length;
	let students = await Users.find({role: 1})

	tests.map(test => {
		AVG_global += test.avg;
		if (test.avg === null)
			AVG_count--;
	})
	// avg is every tests in selected_lesson
	const AVG = AVG_global/100/AVG_count;

	let users = typeof clas !== 'undefined' ? clas.students.map(student => {
		for (let i = 0; i < students.length; i++)
			if(student == students[i]._id.toString())
				return students[i];
	}):[];
	let modify_users = []; // saving id, name and mark

	if(typeof users === "undefined")
		return res.redirect(`/exams/${req.params.id}`)

	users = users.map(user => {
		let have_answer = 0;
		answers.map(answer => answer.author.toString() === user._id.toString() ?
			have_answer = answer.mark : false)
		modify_users.push({
			id: user._id,
			name: user.name,
			mark: have_answer
		})
	})
	res.render('exams', {
		class_id: req.params.id,
		role: req.session.role,
		classes: lessons,
		tests: tests,
		students: modify_users,
		selected_test: selected_test,
		AVG: AVG > 1 ? AVG : 2.5
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
	res.render('school', {
		role: req.session.role,
		title: "MBS - My school",
		lessons_time: lessons_time
	})
})
router.post('/grade/:id/:test', async(req, res) => {
	if(req.session.role < 2){return res.redirect("/school");}

	let marks = req.body.marks;
	let [marksCount, avg] = [marks.length, 0]
	marks.map(async mark => {
		mark = mark.split('_')
		mark[1] = Number(mark[1]);
		if(!(await Answers.findOneAndUpdate({author: mark[0], answer_id: req.params.test},{mark: mark[1]}))){
			let student_ans = new Answers({
				answer_id: req.params.test,
				author: mark[0],
				mark: mark[1]
			})
			await student_ans.save()
		}
		avg += mark[1];
		marksCount = mark[1] != 0 ? marksCount : marksCount--;
	})
	Tests.findOneAndUpdate({_id: req.params.test}, {avg: avg/marksCount})

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
