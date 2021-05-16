const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const User = require('./../Models/Users');
const MSGs = require('./../Models/MSGs');
const Users = require('./../Models/Users');

// 18.2 optimalization completed 67% working well
// functions
function helper_getRelativeDate(x) {
	return new Promise((resolve, reject) => {
		let timeList = [" sekundami", " minutami", " hodinami", " dnami", " mesicemi"]
		let before = "Před "
		if (x > 120) {
			x = Math.floor(x/60);
			if (x > 120) {
				x = Math.floor(x/60);
				if (x > 48) {
					x = Math.floor(x/24);
					if (x > 60) {
						x = Math.floor(x/30);
						if (x > 365) {
							resolve(false)
						} resolve(before + x + timeList[4])
					} resolve(before + x + timeList[3])
				} resolve(before + x + timeList[2])
			} resolve(before + x + timeList[1])
		} resolve(before + x + timeList[0])
	})
}
function getRelativeTime(when) {
	return new Promise(async (resolve, reject) => {
		let returner = await helper_getRelativeDate((new Date().getTime() - when.getTime())/1000)
		resolve(returner ? returner : false)
	})
}
function hashPwd(pwd){
	bcrypt.hash(pwd, 10, (err, hash) => {
		return Promise.resolve(hash);
	})
}

// routes
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'MBS - home',
    link: req.session.loggedin ? "My school": "Join us",
    role: req.session.role
  })
})
router.get('/school', (req, res) => {
	return !req.session.loggedin ?
		res.redirect("/login") : req.session.role > 1 ?
			res.redirect("/teacher") : res.redirect("/student");
})
router.get('/login', (req, res) => {
	return req.session.loggedin?res.redirect("/school"):
		res.render('login',{title:"Login with BMS acc", role:0});
})
router.get('/register', (req, res) => {
	return req.session.loggedin ?
    	res.redirect('/school') : res.render('register',{title:"Register new BMS acc"})
})
router.post("/newacc", async (req, res) => {
	let {name, role, email, pwd, pwdr} = {...req.body}
	const s = req.session;
	role = "teacher" == role ? 2 : 1;

	if(!req.session.loggedin)
		res.redirect('/school');

	else if(pwd !== pwdr)
		res.redirect('/register?bad=pwd');

	else if(!(name && role && email && pwd && pwdr))
		res.redirect("/register?bad=input");

	else {
		pwd = await hashPwd(pwd);
		const user = new User({
			name: name, email: email, role: role, class: null, pwd: hashPwd(pwd)
		});
		await user.save();
		s.user_id = user._id;
		s.loggedin = true;
		s.role = user.role;
		res.redirect("/school")
	}
})
router.get('/news', async (req, res) => {
	if (!req.session.loggedin) {res.redirect("/");return;}

	let msgs = await MSGs.find();
	let teachers = await Users.find({$or: [{"role":2}, {"role":3}]});

	// push MSG to new array
	for (let msg of msgs) {
		msg.when = await getRelativeTime(msg.createdAt);
		for (let teacher of teachers)
			teacher._id.toString() === msg.author.toString() ?
				msg.author_name = teacher.name : ""
	}
	res.render("news", {
		user_id: req.session.user_id,
		role: req.session.role,
		msgs: msgs
	});
})
router.post("/auth", async (req, res) => {
	const [s, b] = [req.session, req.body];
  	if(s.loggedin){ res.redirect("/school"); return; }
	const user = await User.findOne({ $or: [{"name": b.uid},{ "email": b.uid}]});
	console.log(user);
	if (user !== null){
		bcrypt.compare(b.pwd, user.pwd, (err, result) => {
			if(result){
				s.role =  user.role;
				s.loggedin = true;
				s.user_id = user._id;
			}
			return s.loggedin? res.redirect("/school") : res.redirect('/')
		})
	}else{
		return res.redirect('/login?bad=undable-to-find')
	}
})

router.get('/logout', (req, res) => {
  req.session = null;
  return res.redirect("/");
})

// router.get('/logout', ())

module.exports = router;
