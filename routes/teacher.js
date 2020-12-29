const express = require('express');
const router = express.Router();
const session = require('express-session');
const mysql = require('mysql');
require('dotenv').config();

// definitions
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

// routes
router.get('/', (req, res) => {
  res.redirect('/teacher/school')
})
router.get('/school', (req, res) => {
  let role = req.session.role;
  let id = req.session.id;
  let lessons_time = [];
  let classes = [];
  if(id <= 1){
    res.redirect('/student/school');
  }
  connection.query(
    'SELECT * FROM `classes` WHERE `teacher`=?',
    [id], (error, result, fields) => {
      if(error){
        console.log(error);
      }
      classes = result;
			classes.forEach(clas => {
		    let time = item.time;
		    if(time.includes('.')){
		      time = time.replace(' ', '').split('.');
		    }else{
		      time = [time]
		    }
		    time.forEach(item => {
		      let timer = time.split('-');
		      lessons_time.push({
		        id_class: clas.id,
		        name: clas.name,
		        day: timer[0].toLowerCase(),
		        time: Number(timer[1])
		      });
		    });
		  });
  });
  connection.end();
  res.render('school', {
    role: role,
    title: "BMS - My school",
    lessons_time: lessons_time
  });
})

module.exports = router;
