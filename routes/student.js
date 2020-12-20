var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.redirect("/school");
});

router.get('/marks', (req, res) => {
  res.render('mark', {title: "BEAM - my schoool"});
});

module.exports = router;
