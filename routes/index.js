const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const User = require('./../Models/Users');
const MSGs = require('./../Models/MSGs');
const Users = require('./../Models/Users');

// 18.2 optimalization completed 67% working well
// functions
const helper_getRelativeDate = x => {
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
const getRelativeTime = (when) => {
	return new Promise(async (resolve, reject) => {
		let returner = await helper_getRelativeDate((new Date().getTime() - when.getTime())/1000)
		resolve(returner ? returner : false)
	})
}

// routes
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'MBS - home',
    link: req.session.role ? "My schoool": "Join us",
    role: req.session.role
  })
})
router.get('/redirect-home', (req, res) => res.redirect('/'))
router.get('/school', (req, res) => {
	return !req.session.loggedin?res.redirect("/login"):
		req.session.role>1?res.redirect("/teacher"):res.redirect("/student");
})
router.get('/login', (req, res) => {
	return req.session.loggedin?res.redirect("/school"):
		res.render('login',{title:"Login with BMS acc", role:0});
})
router.get('/register', (req, res) => {
	return req.session.loggedin ?
    	res.redirect('/school') : res.render('register',{title:"Register new BMS acc"})
})
router.post("/newacc", (req, res) => {
	let {name, role, email, pwd, pwdr} = {...req.body}
	const s = req.session;
	role = "teacher" == role ? 2 : 1;
	return req.session.loggedin ? res.redirect("/school") :
		!(pwd == pwdr) ? res.redirect('/register?bad=pwd'):
			!(name && role && email && pwd && pwdr) ? res.redirect("/register?bad=input"):
				bcrypt.hash(pwd, 10, (err, hash) => {
					const user = new User({
						name: name, email: email, role: role, class: null, pwd: hash,
						log: { backtime: [new Date().now, "Log has been created"], last:[new Date().now, "Your new account created"]}
					});
					console.log(user);
					user.save().then((result) => {
						s.user_id = user._id;
						s.loggedin = true;
						s.role = user.role;
						// // res.redirect('/school');
						// res.send(result)
						res.redirect("/school")
					}).catch(error => console.log(error));
				})
})
router.get('/news', async (req, res) => {
	if(!req.session.loggedin){res.redirect("/");return;}
	
	let msgs = await MSGs.find();
	let teachers = await Users.find({$or: [{"role":2}, {"role":3}]});

	// push MSG to new array
	msgs.map(async (msg, i) => {
		msg.when = await getRelativeTime(msg.createdAt);
		teachers.map(teacher => 
			teacher._id.toString() === msg.author.toString() ? msg.author_name = teacher.name : ""
		)
		if (i+1 === msgs.length){
			res.render("news", {
				user_id: req.session.user_id,
				role: req.session.role,
				msgs: msgs
			});
		}
	})
})
router.get('/users-list', async (req, res) => {
  try {
    let users = User.find().then((users)=>res.json(users))
  } catch (e) {
    res.send("DB is not working... Contact Support for more info")
  }
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
