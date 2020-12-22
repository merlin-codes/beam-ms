var express = require('express');
var router = express.Router();
const session = require('express-session');

/* GET home page. */
router.get('/', (req, res, next) => {
  let link;
  let isLogged = false;
  if (req.session.loggedin) {
		link = "My School";
    isLogged = true;
	} else {
		link = "Join us";
	}
  res.render('index', {
    title: 'BEAM-ms',
    link: link,
    loggedin: isLogged
  })
})

router.get('/school', (req, res) => {
  if(req.session.loggedin){
    res.render('school', {
      title: "BEAM - my schoool",
      loggedin: true
    })
  }else{
    res.redirect("/");
  }
})

router.get('/login', (req, res) => {
  if(!req.session.loggedin){
    const navlinks = navbar(false);
    res.render('login', {
      title: "Login to BEAM",
      loggedin: false
    })
  }else{
    res.redirect("/school")
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/");
})

// router.get('/logout', ())

module.exports = router;
