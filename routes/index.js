var express = require('express');
const res = require('express/lib/response');
const { signupdetails } = require('../helper/student-helper');
const user_signup = require('../helper/user_signup')
var objectid = require('mongodb').ObjectId
var router = express.Router();
var student_helper = require('../helper/student-helper');
const { redirect, json, status } = require('express/lib/response');
const session = require('express-session');
//const { response, render } = require('../app');
const async = require('hbs/lib/async');
const { route } = require('./users');
const { task, retrive_subjects } = require('../helper/user_signup');
var MongoClient = require('mongodb').MongoClient
var nodemailer = require('nodemailer');
const randomNumbers = require('random-numbers')
const notifier = require('node-notifier');
const { render } = require('../app');









/* GET home page. */
router.get('/', function (req, res, next) {


  if (req.session.loggedin) {
    res.redirect('/profile')
  } else


    res.render('login', { "loginerr": req.session.loginerr, title: "login" });
  req.session.loginerr = false
})



// signup page
router.get('/signup', function (req, res, next) {
  res.render('signup', { title: 'signup' })

})

//signup page submit

router.post('/signup_submit', function (req, res, next) {

  user_signup.checkcode(req.body.mobile).then((data) => {

    if (data.code) {

      user_signup.check_email(req.body.email).then((email) => {

        if (email.email) {
          res.render('signup', { email, title: "signup" })
        }


        else {
          user_signup.signupaction(req.body).then((response) => {
            console.log(response)

            let image = (req.files.profile_pic)
            //console.log(image )
            image.mv('./public/images/' + response.insertedId + '.jpg', (err, done) => {
              if (!err) {
                req.session.loggedin = true
                req.session.user = response
                let user = req.session.user

                let id = objectid(user.id)
                user_signup.getstudent_details(id).then((user) => {
                  res.render('dashboard', { user, title: "Profile" })
                })

              }
            })

          })
        }
      })
    } else {
      res.render('signup', { data, title: "signup" })
    }
  })


})




//profile getting

router.get('/profile', function (req, res, next) {

  user = req.session.user

  if (req.session.loggedin) {

    user_signup.get_payment_details(user).then((payment) => {
      user_signup.get_task_dashboard(user).then((task) => {
        user_signup.getstudent_details(objectid(user._id)).then((user) => {
          console.log(user._id)
          res.render('dashboard', { task, payment, user, title: "Profile" })
        })

      })
    })

  } else {

    res.redirect('/')

  }

})




//login id checking

router.post('/login-check', function (req, res, next) {
  user_signup.checklogin(req.body).then((response) => {

    if (response.status) {
      req.session.loggedin = true
      req.session.user = response.user
      res.redirect('/profile')
    } else {
      req.session.loginerr = true
      res.redirect('/')
    }
  })

})


router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.loggedin = false
  res.redirect('/')
})


router.get('/edit_profile/:id', (req, res, next) => {


  if (req.session.loggedin) {


    let id = objectid(req.params.id)
    //console.log(id)
    // console.log(req.params.id)
    // console.log(objectid(req.params.id))
    user_signup.getstudent_details(id).then((details) => {
      res.render('profile_editing', { details, title: "Profile editing" })
    })

  } else {

    res.redirect('/')

  }




})




router.post('/update_profile/:id', (req, res, next) => {


  let id = objectid(req.params.id)
  let newdata = req.body

  if (req.session.loggedin) {

    console.log(id)

    user_signup.update_profile(id, newdata).then((response) => {
      let data = req.session.user
      user_signup.get_task_dashboard(data).then((task) => {

        user_signup.get_payment_details(data).then((payment) => {

          user_signup.getstudent_details(id).then((user) => {

            user._id = req.session.user._id
            res.render('dashboard', { response, payment, task, user, title: "profile" })

          })


        })
      })



    })


  } else {

    res.redirect('/')

  }




})







router.get('/change_password/:id', (req, res, next) => {
  let id = objectid(req.params.id)
  let user = req.session.user
  if (req.session.loggedin) {

    req
    // console.log(id)
    res.render('password_change', { id, user, title: "password change" })
  } else {

    res.redirect('/')
  }

})





router.post('/updatepassword/:id', (req, res, next) => {
  // console.log(req.params.id)
  let id = objectid(req.params.id)
  //console.log(req.body.oldpass)
  if (req.session.loggedin) {
    user_signup.checkpass(id, req.body.oldpass, req.body.newpass).then((response) => {
      console.log(response)
      if (response.status) {
        let user = req.session.user
        passchange = true
        res.render('dashboard', { "passchange": passchange, user, title: "profile" })

      } else {
        passfailed = true
        res.render('password_change', { id, "passfailed": passfailed, title: "password change" })
      }




    })
  } else {
    res.redirect('/')

  }

})




router.get('/payment/:id', async (req, res) => {
  let id = objectid(req.params.id)
  if (req.session.loggedin) {
    await user_signup.getstudent_details(id).then((details) => {

      //console.log(details)
      res.render('payment', { details, title: "payment" })

    })
  } else {

    res.redirect('/')
  }


})


router.post('/requesting_payment/', (req, res) => {
  let id = (req.body.id)
  let amount = (req.body.amount)
  console.log(req.body)
  user_signup.generateRazorpay(id, amount).then((order) => {
    user_signup.getstudent_details(objectid(id)).then((res) => {
      order.name = res.lastName
      order.email = res.email
      order.mobile = res.mobile

      console.log(order)

    })

    res.json(order)

  })


})

router.post('/verify-payment/response', (req, res) => {
  let payment = (req.body)
  //console.log(payment)
  //let id = objectid((payment['order[receipt]']))

  let id = ((payment['order[receipt]']))
  let amount = (payment['order[amount]'])
  let amount1 = amount / 100
  let data = { "userid": id, "amount": amount1, "name": req.body.name, "course": req.body.course, "startyear": req.body.startyear }
  let emaildetails = { "email": req.body.email, "name": req.body.name }



  user_signup.verifypayment(payment).then((response) => {
    console.log(response)


    res.json(response)


    if (response.status) {


      //notifier.notify('Message');

      // Object
      notifier.notify({
        title: 'Fee payment',
        message: 'you are sucessfully paid ₹' + data.amount + '🫶'
      });


      var transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: 'jba09156448@hotmail.com',
          pass: 'Noufal@6448'
        }
      });

      var mailOptions = {
        from: 'jba09156448@hotmail.com',
        to: emaildetails.email,
        subject: 'Fee payment',
        text: emaildetails.name +
          "\nThis email acknowledges the receipt of your payment for the college fee. We have received the  payment of ₹" + data.amount +
          "\nThank you for choosing the webiste " +
          "\nteamJB",
        html: '<h2>' + emaildetails.name + '</h2><br><h3>This is an email acknowledges  you have sucessfully paid for the college tuition fee. amount of </h3>' + '<h2>' + '₹' + data.amount + '</h2>' + '<h3>Thank you for choosing the JB 🫶</h3>'
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });




      user_signup.sucess_payment(data).then((response) => {



        console.log(response)
      })
      user_signup.payment_fulldata(data).then((res) => {

        console.log(res)
      })
    }
  })
})







router.get('/admin', (req, res) => {


  if (req.session.adminloginerr) {

    res.render('admin', ({ "status": true, title: "Admin Login" }))
    req.session.adminloginerr = false
  } else {
    res.render('admin', ({ title: "Admin Login" }))
  }
})

router.get('/payment/done/:id', (req, res) => {
  let id = objectid(req.params.id)


})


router.get('/fee_history/:id/:course', (req, res) => {
  let id = (req.params.id)
  let course = (req.params.course)
  let data = ({ "id": id, "course": course })
  console.log(data)
  if (req.session.loggedin) {
    let user = req.session.user
    user_signup.get_payment_history(data).then((history) => {
      //console.log(history)

      res.render('feeshistory', { history, user, title: "history" })
    })
  } else {
    res.redirect('/')
  }
})


router.get('/attendance/:id', (req, res) => {
  let user = req.session.user
  if (req.session.loggedin) {
    user_signup.get_task_dashboard(user).then((task) => {
      res.render('attendance', { user, task, title: "Attandance" })
    })

  } else {
    res.redirect('/')
  }

})




router.post('/admin-login-check', (req, res) => {

  console.log(req.body)

  user_signup.admin_login_check(req.body).then((response) => {
    if (response.status) {
      console.log(response)
      req.session.adminloggin = true
      res.render('admin_panel', { title: "Admin panel" })
    }
    else {

      req.session.adminloginerr = true
      res.redirect('/admin')

    }

  })

})


router.get('/get/bca/students', (req, res) => {
  if (req.session.adminloggin) {
    let course = 'BCA'
    user_signup.getallstudent_details(course).then((response) => {

      user_signup.get_task(course).then((data) => {

        res.render('admin_student_table', { response, data })
      })


    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }

})


router.get('/get/bsc/students', (req, res) => {
  if (req.session.adminloggin) {
    let course = 'BSC,ComputerScience'
    user_signup.getallstudent_details(course).then((response) => {

      user_signup.get_task(course).then((data) => {

        res.render('admin_student_table', { response, data })
      })


    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})



router.get('/get/cf/students', (req, res) => {

  if (req.session.adminloggin) {
    let course = 'BSC,CYBERFORENSIC'
    user_signup.getallstudent_details(course).then((response) => {

      user_signup.get_task(course).then((data) => {
        //console.log(data,response)
        res.render('admin_student_table', { response, data })
      })


    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})


router.post('/update/exams/assignment/', (req, res) => {


  user_signup.task(req.body).then((data) => {
    //console.log(data)
  })
  if (req.body.course == "BCA") {
    //user_signup.get_task(req.body.course).then((data) => {

    //console.log(data)
    res.redirect('/get/bca/students');
    //})

  }
  else if (req.body.course == "BSC,CYBERFORENSIC") {
    res.redirect('/get/cf/students')
  }
  else {
    res.redirect('/get/bsc/students')
  }
})

router.get('/admin/panel', (req, res) => {
  if (req.session.adminloggin) {
    res.render('admin_panel')
  } else {
    res.redirect('/admin')
  }
})


router.get('/add/student', (req, res) => {
  if (req.session.adminloggin) {

    res.render('addstudent')
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})

router.post('/add/student/database/', (req, res) => {

  console.log(req.body)
  user_signup.codeinsert(req.body).then((response) => {
    console.log(response)
    if (response.status) {
      res.render('addstudent', ({ "status": true }))
    } else {
      res.render('addstudent', ({ "codeexisted": true }))
    }
  })
})



router.get('/admin/logout', (req, res) => {

  req.session.adminloggin = false
  res.redirect('/admin')
})

router.get('/details/all/users', (req, res) => {
  if (req.session.adminloggin) {
    user_signup.getallstudent_details_admin().then((user) => {
      console.log(user)
      res.render('userdetails', { user })
    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})

router.get('/get/payment/details/bca', (req, res) => {
  if (req.session.adminloggin) {
    data = ({ course: "BCA" })
    user_signup.get_payment_details_all_admin(data).then((user) => {
      //console.log(user)
      res.render('admin_fee_table', { user, "course": "BCA" })
    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})




router.get('/get/payment/details/bsc', (req, res) => {
  if (req.session.adminloggin) {
    data = ({ course: "BSC,ComputerScience" })
    user_signup.get_payment_details_all_admin(data).then((user) => {
      //console.log(user)
      res.render('admin_fee_table', { user, "course": "BSC,ComputerScience" })
    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})


router.get('/get/payment/details/cf', (req, res) => {
  if (req.session.adminloggin) {
    data = ({ course: "BSC,CYBERFORENSIC" })
    user_signup.get_payment_details_all_admin(data).then((user) => {
      //console.log(user)
      res.render('admin_fee_table', { user, "course": "BSC,CYBERFORENSIC" })
    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})


router.get('/get/detail/:id/:course', (req, res) => {
  if (req.session.adminloggin) {


    let id = req.params.id
    let course = req.params.course
    let data = ({ "id": id, "course": course })
    user_signup.get_payment_history(data).then((details) => {

      res.render('payment_student_history_admin', { details })

    })
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})

router.get('/email/all/', (req, res) => {
  if (req.session.adminloggin) {

    res.render('email')
  } else {
    req.session.adminloginerr = true
    res.redirect('/admin')
  }
})

router.post('/send/mail/', (req, res) => {
  console.log(req.body)

  user_signup.collect_all_email().then((email) => {

    console.log(email)

    var transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: 'jba09156448@hotmail.com',
        pass: 'Noufal@6448'
      }
    });



    var mailOptions = {
      from: 'jba09156448@hotmail.com',
      to: email,
      subject: req.body.subject,
      text: req.body.message
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }

    });



  })
})



router.get('/forgetpass', (req, res) => {


  res.render('forgetpass')
})



router.post('/forget-mail', (req, res) => {
  //console.log(req.body.email)
  user_signup.check_email(req.body.email).then((details) => {
    if (details.email) {


      let date_ob = new Date()
      var date = ("0" + date_ob.getDate()).slice(-2);
      let intdate = parseInt(date)
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      let intmonth = parseInt(month)
      let year = date_ob.getFullYear();
      let hours = date_ob.getHours();
      let minutes = date_ob.getMinutes();
      let seconds = date_ob.getSeconds();

      var otp = parseInt(('random', randomNumbers.create(99999, 36489)))

      let data = { "email": details.mail, "otp": otp, "min": minutes, "hrs": hours, "day": intdate, "month": intmonth, "year": year }

      user_signup.check_otpmail(data).then((user) => {
        // ivida otp mail ikanam nodemailer vazhi
        console.log(user)





      })
      res.render('otp', { details })
    } else {

      res.render('forgetpass', { noemail: true })

    }


  })

})


router.post('/otp-send', (req, res) => {

  var num = parseInt(req.body.otp)

  user_signup.retrive_otp(num).then((data) => {

    console.log(data)
    if (data.nootp) {
      res.render('otp', { 'invalidotp': true })

    } else {

      console.log(data)
      let date_ob = new Date()
      let dat = ("0" + date_ob.getDate()).slice(-2);
      let date = parseInt(dat);
      let onth = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      let month = parseInt(onth)
      let year = date_ob.getFullYear();
      let hours = date_ob.getHours();
      let minutes = date_ob.getMinutes();
      let seconds = date_ob.getSeconds();
      let today = (date + "-" + month + "-" + year);
      let time = (hours + ":" + minutes)


      if (year - data.year == 0) {
        if (month - data.month == 0) {
          if (date - data.day == 0) {
            if (hours - data.hrs == 0) {
              if (minutes - data.min <= 10) {

                console.log('otp is valid')
                res.render('forgetpass_reset', { data })

              } else {


                res.render('otp', { 'otptimeout': true })
                console.log('min expired')

              }
            } else {
              res.render('otp', { 'otptimeout': true })
              console.log('hour expired')
            }
          } else {
            res.render('otp', { 'otptimeout': true })
            console.log('day expired')
          }
        } else {
          res.render('otp', { 'otptimeout': true })
          console.log('month expired')
        }

      } else {
        res.render('otp', { 'otptimeout': true })
        console.log('year expired')
      }

    }





  })






})



router.post('/pass_re_set', (req, res) => {

  console.log(req.body)
  user_signup.resetpass_otp(req.body).then((data) => {
    let email = req.body.email
    console.log(data)
    if (data.updated) {


      var transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: 'jba09156448@hotmail.com',
          pass: 'Noufal@6448'
        }
      });


      var mailOptions = {
        from: 'jba09156448@hotmail.com',
        to: email,
        subject: 'Password changing OTP',
        text: 'this is the OTP for changing password in student account ,OTP is vaild for only 10 minutes',
        html: '<h3> Your password is successfully changed now you can login using your new password .<br><h4>Team JB 👽</h3>'
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }

      });

      notifier.notify('your password is changed successfully ');

    }

  })

  res.redirect('/')


})

router.get('/sem_marks/:id/:sem/:course', (req, res) => {

  if (req.params.course == 'BSC,CYBERFORENSIC') {
    req.params.course = 'CF'
  } else if (req.params.course == 'BSC,Computer Science') {
    req.params.course = 'CS'
  }
  else {
    req.params.course = 'BCA'
  }
  let data = { sem: req.params.sem, course: req.params.course, id: req.params.id }

  console.log(data)
  user_signup.retrive_subjects(data).then((subject) => {
    user_signup.retrive_marks(data).then((marks) => {
      let user = req.session.user



      console.log(user)

      res.render('sem_mark_sheet_user', { subject, user, marks, data, title: "Marks" })

    })

  })

})

router.get('/admin/marks_selection', (req, res) => {

  res.render('marks_selection')

})

router.post('/admin/marks_selection', (req, res) => {
  console.log(req.body)
  if (req.body.course == 'CF') {
    req.body.course = 'BSC,CYBERFORENSIC'
  } else if (req.body.course == 'CS') {
    req.body.course = 'BSCBSC,Computer Science'
  }
  else {
    req.body.course = 'BCA'
  }
  user_signup.find_with_course_year_and_course(req.body).then((data) => {

    let course = (data[0].course)
    console.log(data)
    res.render('name_selection', { data, course })
  })

})


router.get('/admin/put/sem_marks/:id/:course/:name/:sem', (req, res) => {
  if (req.params.course == 'BSC,CYBERFORENSIC') {
    req.params.course = 'CF'
  } else if (req.params.course == 'BSC,Computer Science') {
    req.params.course = 'CS'
  }
  else {
    req.params.course = 'BCA'
  }
  let data = { course: req.params.course, sem: req.params.sem }
  let detail = { name: req.params.name, sem: req.params.sem, id: req.params.id }
  user_signup.retrive_subjects(data).then((subject) => {
    user_signup.retrive_marks(detail).then((marks) => {

      console.log(marks)
      console.log(subject)
      res.render('sem_mark_sheet_admin', { subject, marks, detail })
    })

  })
})

router.get('/admin/add_subject', (req, res) => {
  res.render('add_subject_stage1')
})

router.get('/admin/add_subject/:course', (req, res) => {
  var course = (req.params.course)
  res.render('add_subject_stage2', { course })


})

router.get('/admin/add_subject/:course/:sem', (req, res) => {
  let course = (req.params.course)
  let sem = (req.params.sem)
  let data = { course: course, sem: sem }
  user_signup.retrive_subjects(data).then((data) => {

    console.log(data)
    res.render('add_subject_stage3', { data, course, sem })
  })


})
router.post('/admin/add_subject', (req, res) => {

  console.log(req.body)
  user_signup.adding_subject(req.body).then((data) => {

    console.log(data)
    if (data.updated) {
      notifier.notify({
        title: 'Subject added',
        message: req.body.sem + '  subjects for  ' + req.body.course + ' was sucessfully added'
      });
    } else {
      notifier.notify({
        title: 'Subject added',
        message: req.body.sem + ' subjects for ' + req.body.course + 'was sucessfully added'
      });
    }

  })
  res.redirect('/admin/add_subject')
})
/////////////////////////////////////////////////
router.post('/admin/sem_mark/upload', (req, res) => {
  console.log(req.body)
  user_signup.adding_marks(req.body).then((data) => {

    console.log(data)
    if (data.updated) {

      
      res.json(data)
    }
  })

})

router.get('/manager', (req, res) => {

  if (session.managerloggin) {

    res.render('manager')
  }
  else {
    res.redirect('/manager/login')
  }


})

router.get('/manager/get_student_details_page/:cousre', (req, res) => {
  let course = req.params.cousre

  if (session.managerloggin) {
    res.render('student_details_management', { course })
  } else {
    res.redirect('/manager/login')
  }
})



router.get('/manager/get_student_details', (req, res) => {

  console.log(req.query)
  if (session.managerloggin) {
    user_signup.find_with_course_year_and_course(req.query).then((result) => {
      console.log(result)
      res.json(result);

    })
  } else {
    res.redirect('/manager/login')
  }


})

router.get('/manager/add_prince', (req, res) => {

  if (session.managerloggin) {
    user_signup.get_details_principal().then((details) => {
      console.log(details)
      res.render('create_prince', { details })

    })
  } else {
    res.redirect('/manager/login')
  }




})

router.post('/manager/principal_account_creation', (req, res) => {
  //console.log(req.body)

  if (session.managerloggin) {
    user_signup.add_principal(req.body).then((result) => {
      console.log(result)
      res.json(result)

    })
  } else {
    res.redirect('/manager/login')
  }



})

router.get('/manager/get_fee_details_page/:course', (req, res) => {

  var course = req.params.course
  //console.log(course)

  res.render('manager_student_payment_details_page', { course })
})

router.get('/manager/get_fee_details', (req, res) => {

  data = { "startyear": req.query.startyear, "course": req.query.course }


  console.log(data)
  user_signup.get_payment_details_all_manager(data).then((result) => {

    console.log(result)


    res.json(result)

  })




})


router.get('/manager/get_fee_details_individual/:course', (req, res) => {

  console.log(req.query)
  console.log(req.params.course)
  var data = { "id": req.query.id, "course": req.params.course }
  if (session.managerloggin) {
    user_signup.get_payment_history(data).then((data) => {

      console.log(data)
      res.render('manager_single_student_fee', { data, course: req.params.course, name: req.query.name, year: req.query.startyear })

    })
  } else { res.redirect('/manager/login') }



})

router.delete('/manager/delete/prince', (req, res) => {
  var data = { id: (objectid(req.body.id)) }
  if (session.managerloggin) {
    user_signup.delete_principal(data).then((result) => {

      res.json(result)

    })
  } else {
    res.redirect('/manager/logout')
  }


})


router.get('/manager/login', (req, res) => {
  res.render('manager_login')

})

router.post('/manager/login', (req, res) => {
  user_signup.create_manager({email:'muhammednoufal@gmail.com',pass:'noufal@12'}).then((res)=>{
 
    console.log(res)
  })
  user_signup.manager_login_check(req.body).then((result) => {

    if (result.status) {

      session.managerloggin = true
      res.redirect('/manager')
    } else {
      session.managerloggin = false
      res.render('manager_login', { manager_not_loggin: true })
    }

  })
})


router.get('/manager/logout', (req, res) => {
  session.managerloggin = false
  res.render('manager_login')
})


router.get('/manager/hod/signup', (req, res) => {
  res.render('HOD_signup')
})


router.post('/manager/hod/signup', (req, res) => {
  console.log(req.body)
  user_signup.add_principal_password(req.body).then((response) => {

    console.log(response)
    if (response.no_email) {
      res.render('HOD_signup', { response })
    } else if (response.pass_added) {
      res.render('HOD_signup', { response })
    } else if (response.user_existed) {

      res.render('HOD_signup', { response })
    }
  })
})

module.exports = router