const express = require('express');
const router = express.Router();
const session = require('express-session');
const mysql = require('mysql');
const bcrypt = require('bcrypt');

const saltRounds = 10;
// const myPlaintextPassword = 's0/\/\P4$$w0rD';
// const someOtherPlaintextPassword = 'not_bacon';

const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

/* GET home page. */
router.get('/', (req, res, next) => {
  let link;
  if(typeof req.session.role !== 'undefined'){
    link = "My school";
  }else{
    link = "Join us";
  }
  res.render('index', {
    title: 'MBS - home',
    link: link,
    role: req.session.role
  })
})

router.get('/school', (req, res) => {
	let role = req.session.role;
	if(Number.isInteger(role)){
		if(Number(role) >= 2){
			res.redirect("/teacher/school");
			return;
		}else{
			res.redirect("/student/school");
			return;
		}
  }
	res.redirect("/login");
})

router.get('/login', (req, res) => {
  if(req.session.role > 0){
    res.redirect("/school")
  }else{
    res.render('login', {
      title: "Login with BMS acc",
      role: 0
    });
  }
})

router.get('/register', (req, res) => {
  if(req.session.loggedin){
    res.redirect('/school')
  }else{
    res.render('register', {
      title: "Register new BMS acc",
    })
  }
})

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

router.get('/news', (req, res) => {
	if(!req.session.loggedin){
		res.redirect("/");
		return;
	}
	connection.query("SELECT * FROM `msg`",[],(error, result, fields)=>{
		let msgs = result;
		let msgs_complete = [];
		msgs.forEach((msg, i) => {
			connection.query("SELECT `id`, `name` FROM `users` WHERE `id`=?",[msg.id_user], (error, result, fields)=>{
				let moreThanOneYear = false;
				let timeRealitive = Math.floor((new Date() - msg.when)/1000);
				if(timeRealitive > 60){
					timeRealitive = Math.floor(timeRealitive/60);
					if(timeRealitive > 60){
						timeRealitive = Math.floor(timeRealitive/60);
						if(timeRealitive > 24){
							timeRealitive = Math.floor(timeRealitive/24);
							if(timeRealitive > 365){
								moreThanOneYear = true;
							}else if(timeRealitive > 30){
								timeRealitive = "Before "+timeRealitive+" months"
							}else{
								timeRealitive = "Before "+timeRealitive+" days";
							}
						}else{
							timeRealitive = "Before "+timeRealitive+" hourse";
						}
					}else{
						timeRealitive = "Before "+timeRealitive+" minutes";
					}
				}else{
					timeRealitive = "Before "+timeRealitive+" seconds";
				}
				if(!moreThanOneYear){
					msgs_complete.push({
						id: msg.id,
						user: result[0].name,
						id_user: result[0].id,
						content: msg.content,
						when: timeRealitive
					});
				}
				if(msgs.length === i+1){
					res.render("news", {
						user_id: req.session.user_id,
						role: req.session.role,
						news_list: msgs_complete
					});
					return;
				}
			});
		});
	});
})

router.get('/remove_msg/:id', (req, res) => {
	if(req.session.role < 1){
		res.redirect("/");
		return;
	}
	connection.query("DELETE FROM `msg` WHERE `id`=? AND `id_user`=?", [req.params.id, req.session.user_id], (error, result, fields) => {
		if(error) console.log(error);
	})
	res.redirect('/news');
	return;
})

router.post("/auth", (req, res) => {
  if(req.session.loggedin){res.redirect("/school");return;}
	connection.query('SELECT * FROM users WHERE email = ?',[req.body.uid], (error, result, fields) => {
		if(error){
			console.log(error);
		}
		if(result !== undefined){
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
  });
})

router.get('/logout', (req, res) => {
  req.session = null;
  res.redirect("/");
})

// router.get('/logout', ())

module.exports = router;
