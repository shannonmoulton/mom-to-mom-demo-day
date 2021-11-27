module.exports = function(app, passport, db, multer, ObjectId) {
     // Image Upload Code =========================================================================
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + ".png")
  }
});
var upload = multer({storage: storage}); 

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('messages').find().toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user, 
            messages: result
          })
        })
    });

    app.get('/events', isLoggedIn, function(req, res) {
      db.collection('events').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('events.ejs', {
          user : req.user,
          events: result
        })
      })
  });
  app.get('/resources', isLoggedIn, function(req, res) {
    db.collection('resources').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('resources.ejs', {
        user : req.user,
        resources: result
      })
    })
});
 
  //thread feed
  app.get('/forum', function(req, res) {
    let postId = ObjectId(req.params.id)
    db.collection('threads').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('forum.ejs', {
          user: req.user,
          threads: result
      })
    })
  });
  // individual thread page
  app.get('/thread/:threadId', isLoggedIn, function(req, res) {
    let threadId = ObjectId(req.params.threadId)
    console.log(threadId)
    db.collection('threads').find({_id: threadId}).toArray((err, result) => {
      db.collection('comments').find({threadId: threadId }).toArray((err, allComments) => {
        if (err) return console.log(err)
        res.render('thread.ejs', {
          user: req.user,
          threads: result,
          comments: allComments
        })
      })
    })
  });
  
    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/submitEvent', (req, res) => {
      let user = req.user._id
      db.collection('events').save({category: req.body.category, 
        eventName: req.body.eventName,date: req.body.date, time: req.body.time, zipcode: req.body.zipcode, eventDescription: req.body.eventDescription,user: req.user.local.username}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/events')
      })
    })
    app.post('/createThread', upload.single('fileToUpload'), (req, res) => {
      let user = req.user._id
      db.collection('threads').save({title: req.body.title,description: req.body.description, img: 'images/uploads/' + req.file.filename, user: req.user.local.username,timestamp: req.body.timestamp, comments: 0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/forum')
      })
    })
    app.post('/makeComment/:threadId', (req, res) => {
      let threadId = ObjectId(req.params.threadId)
      db.collection('comments').save({user: req.user.local.username, comment: req.body.comment, threadId: threadId}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect(`/thread/${threadId}`) 
      })
    })
    app.post('/savedResources', (req, res) => {
      let threadId = ObjectId(req.params.threadId)
      db.collection('savedResources').save({user: req.user.local.username, comment: req.body.comment, threadId: threadId}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/') 
      })
    })

    // app.put('/savedItems', (req, res) => {
    //   db.collection('savedItems')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp + 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })
    

    // app.put('/thumbDown', (req, res) => {
    //   db.collection('messages')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp - 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })

    app.delete('/delete', (req, res) => {
      db.collection('events').findOneAndDelete({  _id: ObjectId(req.body.id)}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
        // app.post('/signup',  upload.single('fileToUpload'), (req, res) => {
        //   let user = req.user._id
        //   db.collection('user').save({ img: 'images/uploads/' + req.file.filename}, (err, result) => {
        //     if (err) return console.log(err)
        //     console.log('saved to database')
        //     res.redirect('/profile')
        //   })
        // })

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
