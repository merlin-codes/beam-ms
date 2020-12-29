const express = require('express');
const router = express.Router();
const session = require('express-session');

router.get('/', (req, res)=>{
  if(req.session.role <= 2){
    res.redirect("/school");
  }
  // level = false for user, true for lessons
  if(req.session.level){
    res.redirect("/lessons");
  }else{
    res.redirect("/users");
  }
})

router.get('/lessons', (req, res)=>{
  if(req.session.role <= 2){
    res.redirect("/school");
  }
  req.session.level = true;
  
})

router.get('/users', (req, res)=>{
  if(req.session.role <= 2){
    res.redirect("/school");
  }
  req.session.level = false;
})

module.exports = router;
