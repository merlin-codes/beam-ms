const express = require('express');
const router = express.Router();
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');

const saltRounds = 10;
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

// functions
const basicDefence = (role, who) => {
	if(Number.isInteger(role)){
		if(role === who || who === 10){
			return;
		}else{
			return false;
		}
	}else{
		return "/login";
	}
}
const getRealativeDate = (getDate) => {
	date = Math.floor((new Date()-getDate)/1000);
	let timers = [
			{time: "second", max: 60},
			{time: "minute", max: 60},
			{time: "hour", max: 24},
			{time: "day", max: 365}
		];
	let before = "Before";
	for (var i = 0; i < timers.length; i++) {
		let more = "";
		if(date > timers[i].max){
			date = Math.floor(date/timers[i].max);
			if(i === timers.length-1){
				return false;
			}
		}else{
			if(!(date < 2)){more = "s";}
			return `${before} ${date} ${timers[i].time+more}`;
		}
	}
}

// Basic pages
router.get('/', (req, res) => {
	let link = "";
	if(req.session.loggedin){
		link = "My School";
	}else{
		link = "Join us";
	}
	res.render('index', {
		title: "BEAM - MS",
		link: link,
		role: req.session.role
	})
});
router.get('/school', (req, res) => {
	let role = req.session.role;
	let defence =  basicDefence(role, 1);
	if(defence){
		res.redirect(defence);
	}else if(req.session.loggedin){
		let redirect_link = ""
		if(Number(role) >= 2){
			redirect_link = "teacher";
		}else{
			redirect_link = "student";
		}
		res.redirect(`/${redirect_link}/school`)

  }
});
router.get('/news', (req, res) => {
	let defence = basicDefence(req.session.role, 10);
	if(defence){
		res.redirect(defence);
	}else{
		connection.query("SELECT * FROM `msg` LIMIT 20",[],
		(error, result, fields) => {
			let msgs = result;
			let msgs_complete = [];
			msgs.forEach((msg, i) => {
				connection.query("SELECT `id`, `name` FROM `users` WHERE `id`=?",[msg.id_user],
				(error, result, fields)=>{
					msg.id_user = result[0].name;
					let timeRealitive = getRealativeDate(msg.when);
					if(timeRealitive){
						msgs_complete.push({
							id: msg.id,
							id_user: result[0].name,
							content: msg.content,
							when: timeRealitive
						});
					}
					if(msgs.length === i+1){
						res.render("news", {
							role: req.session.role,
							news_list: msgs_complete.reverse()
						});
					}
				});
			});
		});
	}
})

// Backend Request Global
router.post("/newacc", (req, res) => {
  if(req.session.loggedin){
    res.redirect("/school");
  }
  let name = req.body.name;
  let role = req.body.role;
  let uid = req.body.email;
  let pwd = req.body.pwd;
  let pwdr = req.body.pwdr;

  if((pwd === pwdr) && !(name == "" || role == "" || uid == "" || pwd == "" || pwdr == "" )){
    if(role == "teacher"){
      role = 2;
    }else{
      role = 1;
    }
    bcrypt.hash(pwd, 10, (err, hash) => {
      connection.query(
        `INSERT INTO users(name, pwd, email, role) VALUES (?, ?, ?, ? )`,
        [name, hash, uid, role], (error, result, fields) => {
          req.session.id = role;
          req.session.loggedin = true;
					req.session.user_id = result.insertId;
          res.redirect("/school")
        }
      )
    });
  }else{
    res.redirect("/register?bad")
  }
})
router.post("/auth", (req, res) => {
  if(req.session.loggedin){
    res.redirect("/school");
		return;
  }
	connection.query(
    'SELECT * FROM users WHERE email = ?',
    [req.body.uid], (error, result, fields) => {
			if (result.length > 0){
				let user = result[0];
				bcrypt.compare(req.body.pwd, user.pwd, (err, result2) => {
			    if(!result2){
						res.redirect("/");
						return;
					}else{
						req.session.role = user.role;
						req.session.loggedin = true;
						req.session.user_id = user.id;
						res.redirect("/school");
						return;
					}
				});
	    }else{
				res.send("incorrect username of password, if is your password correct please contact our support.");
	    }
  }
	);
})

// Global pages
router.get('/login', (req, res) => {
  if(req.session.role > 0){
    res.redirect("/school");
  }else{
    res.render('login', {
      title: "Login to BEAM",
      role: req.session.role
    });
  }
})
router.get('/register', (req, res) => {
  if(req.session.loggedin){
    res.redirect('/school');
  }else{
    res.render('register', {
      title: "Register new acc",
    });
  }
})
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
})

module.exports = router;
