const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');

// 18.2 optimalization completed 67% working well

// let sqlite3 = require('sqlite3').verbose();
// let db = new sqlite3.Database('../main.sqlite');

// db.serialize(() => {
// 	db.run("CREATE TABLE ")
// })

// Define variables
const saltRounds = 10;
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

// Define functions

// Get Full Table
const getAllMsgs = () => {
	return new Promise(async (resolve, reject) => {
		connection.query("SELECT * FROM msg", [],(error, result, fields) => {
			resolve(result);
		})
	})
}
const getAllTeacher = () => {
	return new Promise((resolve, reject) => {
		connection.query("SELECT * FROM users WHERE role>1", [], (error, result, fields) => {
			resolve(result);
		})
	})
}

// helping function
const getRelativeTime = (when) => {
	return new Promise((resolve, reject) => {
		let timeRealitive = Math.floor((new Date() - when)/1000);
		if(timeRealitive > 60){
			timeRealitive = Math.floor(timeRealitive/60);
			if(timeRealitive > 60){
				timeRealitive = Math.floor(timeRealitive/60);
				if(timeRealitive > 24){
					timeRealitive = Math.floor(timeRealitive/24);
					if(timeRealitive > 365){
						resolve(false)
					}else if(timeRealitive > 30){
						resolve("Before "+(Math.floor(timeRealitive/30))+" months")
					}else{
						resolve("Before "+timeRealitive+" days");
					}
				}else{
					resolve("Before "+timeRealitive+" hourse");
				}
			}else{
				resolve("Before "+timeRealitive+" minutes");
			}
		}else{
			resolve("Before "+timeRealitive+" seconds");
		}
	})
}

// Remove from DB
const removeMsgById = (id, user_id) => {
	return new Promise((resolve, reject) => {
		connection.query("SELECT * FROM msg WHERE id=?", [Number(id)], (error, result, fields) => {
			let msg = result[0];
			console.log(msg);
			if (msg === null  && msg.id_user !== user_id){
				console.log("false");
				resolve(false)
			} else {
				console.log("true");
				connection.query("DELETE FROM msg WHERE id=?", [Number(id)], (e, r, f) =>{
					resolve(true)
				});
			}
		})
	})
}

// routes
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

	// redirect by role 
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

router.get('/news', async (req, res) => {
	if(!req.session.loggedin){ res.redirect("/"); return; }

	let msgs = await getAllMsgs();
	let teachers = await getAllTeacher();

	let msgs_complete = [];
	
	// push MSG to new array
	for (let i = 0; i < msgs.length; i++) {
		msgs[i].when = await getRelativeTime(msgs[i].when)
		for (let j = 0; j < teachers.length; j++) {
			if(msgs[i].when && msgs[i].id_user === teachers[j].id){
				msgs_complete.push({
					id: msgs[i].id,
					user: teachers[j].name,
					id_user: teachers[j].id,
					content: msgs[i].content,
					when: msgs[i].when
				})
			}
		}
	}

	res.render("news", {
		user_id: req.session.user_id,
		role: req.session.role,
		news_list: msgs_complete
	});
})

router.get('/remove_msg/:id', async (req, res) => {
	await removeMsgById(req.params.id, req.session.user_id);
	
	res.redirect('/news');
	return;
})

router.post("/auth", (req, res) => {
  if(req.session.loggedin){ res.redirect("/school"); return; }
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
