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

const login = (req, res, username, password) => {
  connection.query(
    'SELECT * FROM users WHERE email = ?',
    [username], (error, result, fields) => {
			if(result === undefined){
				res.redirect('/login')
			}
	    if(result.length > 0){
	      result.forEach((item) => {
	        if(bcrypt.compare(password, item.pwd, function(err, result) {return true})){
	          req.session.role = item.role;
	          req.session.loggedin = true;
	          req.session.user_id = item.id;
	          console.log(result);
	          res.redirect("/school");
	        }
	      });
	    }else{
	      res.send("incorrect username of password");
	    }
  });

  if (username && password) {
    connection.query(
      'SELECT * FROM users WHERE email = ? AND pwd = ?',
      [username, password], (error, result, fields) => {
      if(result.length > 0){
				req.session.role = result[0].role;
        req.session.loggedin = true;
        req.session.usernam = username;
        console.log(result);
        res.redirect("/school");
      }else{
        res.send("incorrect username of password");
      }
    });
		connection.end()
		console.log(req.session.role);
  }else {
    res.send("Password or username is empty");
  }
  return;
}

/* GET home page. */
router.get('/', (req, res, next) => {
  let link;
  let role = req.session.role;
  if(!Number.isInteger(role)){
    if (role > 0) {
      link = "My School";
      isLogged = true;
    } else {
      link = "Join us";
    }
    res.render('index', {
      title: 'BEAM-ms',
      link: link,
      role: role,
    })
  }
})

router.get('/school', (req, res) => {
	let role = req.session.role;
	if(!Number.isInteger()){
		if(role >= 2){
			res.redirect("/teacher/school");
		}else{
			res.redirect("/student/school");
		}
  }else{
    res.redirect("/");
  }
})

router.get('/login', (req, res) => {
  if(req.session.role > 0){
    res.redirect("/school")
  }else{
    res.render('login', {
      title: "Login to BEAM",
      role: req.session.role
    })
  }
})

router.get('/register', (req, res) => {
  if(req.session.loggedin){
    res.redirect('/school')
  }else{
    res.render('register', {
      title: "Register new acc",
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
          console.log(error);
          req.session.role = role;
          req.session.loggedin = true;
          res.redirect("/school")
        }
      )
    });
		login(req, res, uid, pwd)
  }else{
    res.redirect("/register?bad")
  }
})

router.post("/auth", (req, res) => {
  if(req.session.loggedin){
    res.redirect("/school");
    return;
  }
  let username = req.body.uid;
  let password = req.body.pwd;
	login(req, res, username, password)
})

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
})

// router.get('/logout', ())

module.exports = router;
