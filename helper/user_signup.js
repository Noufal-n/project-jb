var db = require('../config/connection')
const bcrypt = require('bcrypt')
var Promise = require('promise');
var nodemailer = require('nodemailer')
const Razorpay = require('razorpay');
const { reject, resolve } = require('promise');
const { promise } = require('bcrypt/promises');
const async = require('hbs/lib/async');
const { status } = require('express/lib/response');
const { ObjectId } = require('mongodb');
var objectId = require('mongodb').ObjectId
var instance = new Razorpay({
    key_id: 'rzp_test_tDTQ9r7EYTZQwZ',
    key_secret: 'wV4TjHtXZxPBo4Hf68Y0JWTa'
})

module.exports = {

    signupaction: (userdata) => {
        return new Promise(async (resolve, reject) => {
            userdata.password = await bcrypt.hash(userdata.password, 10)
            db.get().collection('student_details').insertOne(userdata).then((data) => {
                // console.log(userdata)
                //console.log(data)
                resolve(data)
            })



        })
    }

    ,
    checklogin: (userdata) => {
        return new Promise(async (resolve, reject) => {
            let loginstatus = false
            let response = {}
            let user = await db.get().collection('student_details').findOne({ email: userdata.email })
            // console.log(user.password)
            // console.log(userdata.password)
            if (user) {
                await bcrypt.compare(userdata.password, user.password).then((status) => {
                    if (status) {
                        console.log("login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log("login failed")
                        resolve({ status: false })
                    }
                })

            } else {
                console.log("loginfailed")
                resolve({ status: false })
            }
        })

    }
    ,
    getstudent_details: (id) => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('student_details').findOne({ _id: id })
            resolve(user)
            //console.log(user)

        })

    },
    getallstudent_details: (data) => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('student_details').find({ course: data }).toArray()
            resolve(user)
            console.log(user)

        })

    },


    getallstudent_details_admin: () => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('student_details').find().toArray()
            resolve(user)
            //console.log(user)

        })

    },



    update_profile: (id, details) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('student_details').findOne({ _id: id })
            //console.log(user)

            if (user) {

                db.get().collection('student_details').updateOne({ _id: id }, {
                    $set: {
                        firstName: details.firstName,
                        lastName: details.lastName,
                        mobile: details.mobile,
                        Address: details.address,
                        email: details.email,
                    }
                })
                console.log('profile update successfully')
                resolve({ status: true })
            } else {
                console.log('profile updation failed')
                return resolve({ status: false });
            }


        })








    }
    ,








    checkpass: (id, oldpass, newpass) => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('student_details').findOne({ _id: id })
            // console.log(user.password)
            // console.log(userdata.password)
            if (user) {
                await bcrypt.compare(oldpass, user.password).then(async (status) => {
                    if (status) {
                        newpassword = await bcrypt.hash(newpass, 10)
                        db.get().collection('student_details').updateOne({ _id: id }, {
                            $set: {

                                password: newpassword
                            }
                        })
                    } else {
                        console.log("updation of password failed")
                        resolve({ status: false })
                    }

                })
                //console.log('password update sucessfully')
            } else {
                resolve({ status: false })

                console.log('updation failed')
            }
            resolve({ status: true })
        })

    }
    ,
    generateRazorpay: (id, fees) => {
        console.log(id)
        return new Promise((resolve, reject) => {
            var options = {
                amount: fees * 100,
                currency: "INR",
                receipt: id,
            }
            instance.orders.create(options, function (err, order) {
                console.log(err)
                resolve(order)
            })
        })
    }
    ,

    verifypayment: (details) => {
        console.log(details)
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'wV4TjHtXZxPBo4Hf68Y0JWTa')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve({ status: true })
            } else {
                reject({ status: false })
            }

        })


    }
    ,



    sucess_payment: (data, payment) => {

        // console.log(data)
        //this.payment_fulldata(payment)

        let date_ob = new Date()
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let today = (date + "-" + month + "-" + year);
        let time = (hours + ":" + minutes);

        return new Promise(async (resolve, reject) => {





            let user = await db.get().collection('receved_payment').findOne({ userid: data.userid })
            //console.log(user)

            if (user) {
                let newamount = (user.amount) + (data.amount)
                db.get().collection('receved_payment').updateOne({ userid: data.userid }, {
                    $set: {
                        date: today,
                        time: time,
                        amount: newamount,
                        startyear: data.startyear
                    }

                })
                console.log('update sucess')
            } else {

                db.get().collection('receved_payment').insertOne(({ "userid": data.userid, "course": data.course, "name": data.name, "amount": data.amount, "date": today, "time": time })).then((data) => {

                    resolve(data)
                })
            }

        })
    },

    payment_fulldata: (data) => {
        let date_ob = new Date()
        let date = ("0" + date_ob.getDate()).slice(-2);
        let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let today = (date + "-" + month + "-" + year);
        let time = (hours + ":" + minutes);

        return new Promise((resolve, reject) => {

            console.log(data)


            if (data.course === "BCA") {

                db.get().collection('payments_of_bca').insertOne({ "course": data.course, "userid": data.userid, "name": data.name, "amount": data.amount, "date": today, "time": time, "startyear": data.startyear }).then((data) => {


                })

            } else if (data.course === "BSC,ComputerScience") {

                db.get().collection('payments_of_bsc_computerscience').insertOne({ "course": data.course, "userid": data.userid, "name": data.name, "amount": data.amount, "date": today, "time": time, "startyear": data.startyear }).then((data) => {

                    //console.log(data)
                })


            }


            else {

                db.get().collection('payment_of_BSC_CYBERFORENSIC').insertOne({ "course": data.course, "userid": data.userid, "name": data.name, "amount": data.amount, "date": today, "time": time, "startyear": data.startyear }).then((data) => {

                    //console.log(data)
                })

            }



        })
    },


    get_payment_details: (data) => {


        return new Promise(async (resolve, reject) => {


            let details = await db.get().collection('receved_payment').findOne({ userid: data._id })

            if (details) { resolve(details) }
            else {
                amount = 0
                nouser = ({ "amount": amount, "date": null })
                resolve(nouser)
            }


            //console.log(details)


        })


    }
    ,

    get_payment_details_all_admin: (data) => {


        return new Promise(async (resolve, reject) => {


            let details = await db.get().collection('receved_payment').find({ course: data.course }).toArray()

            if (details) { resolve(details) }
            else {
                amount = 0
                nouser = ({ "amount": amount, "date": null })
                resolve(nouser)
            }


            //console.log(details)


        })


    }
    ,

    get_payment_history: (data) => {


        //console.log(data)
        return new Promise(async (resolve, reject) => {

            if (data.course === "BCA") {

                let details = await db.get().collection('payments_of_bca').find({ userid: data.id }).toArray()

                resolve(details)



            } else if (data.course === "BSC,ComputerScience") {

                let history = await db.get().collection('payments_of_bsc_computerscience').find({ userid: data.id }).toArray()
                resolve(history)
            } else if (data.course === "BSC,CYBERFORENSIC") {

                let history = await db.get().collection('payment_of_BSC_CYBERFORENSIC').find({ userid: data.id }).toArray()
                resolve(history)
            }
            else {
                data = ({ "status": false })
                reject(data)
            }


        })


    }
    ,

    admincreation: (userdata) => {


        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('admin_check').findOne({ email: userdata.email })
            if (user) {
                //console.log(user)
                resolve({ "admin_existed": true })
            } else {
                userdata.password = await bcrypt.hash(userdata.password, 10)
                db.get().collection('admin_check').insertOne(userdata).then((data) => {
                    // console.log(userdata)
                    //console.log(data)
                    resolve(data)
                })

            }

        })
    },


    admin_login_check: (data) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('principal').findOne({ email: data.email })
            if (user) {
                await bcrypt.compare(data.password, user.password).then(async (res) => {
                    if (res) {
                        console.log("admin login pass")
                        resolve({ "status": true })
                    } else {
                        console.log("admin login fail")
                        resolve({ "status": false })
                    }

                })
            } else {
                console.log("admin_logg fail")
                resolve({ "status": false })
            }
        })

    },


    manager_login_check: (data) => {

        return new Promise(async (resolve, reject) => {



            let user = await db.get().collection('admin_check').findOne({ email: data.email })
            if (user) {
                await bcrypt.compare(data.password, user.password).then(async (res) => {
                    if (res) {
                        console.log("admin login pass")
                        resolve({ "status": true })
                    } else {
                        console.log("admin login fail")
                        resolve({ "status": false })
                    }

                })
            } else {

                console.log("admin_logg fail")
                resolve({ "status": false })
            }

        })

    },

    create_manager: (data) => {
        return new Promise(async (resolve, reject) => {
            let pass = await bcrypt.hash("noufal@6448", 10)
            let user = await db.get().collection('admin_check').findOne({ email: data.email })
           
                if (!user) {


                    db.get().collection('admin_check').insertOne({ email: 'muhammednoufal@gmail.com', password: pass }).then((data) => {
                        console.log(data)
                    })
                }else{
                    resolve("manager existed")
                }

            })

        

    },
    task: (data) => {
        console.log(data)

        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('task').findOne({ userid: data.userid })
            if (user) {
                db.get().collection('task').updateOne({ userid: data.userid }, {
                    $set: {
                        exams: data.exams,
                        assignment: data.assignment,
                        attandance: data.attandance
                    }
                })
                console.log('data updated')
            } else {
                db.get().collection('task').insertOne(data).then((response) => {
                    resolve(response)
                })
            }



        })
    },
    get_task: (data) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('task').find({ course: data }).toArray()
            resolve(user)
        })

    },
    get_task_dashboard: (data) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('task').findOne({ userid: data._id })
            resolve(user)
        })

    },
    codeinsert: (data) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('code').findOne({ code: data.code })
            if (user) {
                resolve({ "codeexisted": true })
            } else {
                await db.get().collection('code').insertOne(data).then((res) => {
                    console.log(res)
                    resolve({ "status": true })
                })
            }
        })

    },
    checkcode: (data) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('code').findOne({ code: data })
            if (user) {
                resolve({ "code": true })
            } else {
                resolve({ "nocode": true })
            }
        })

    },
    check_email: (email) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('student_details').findOne({ email: email })
            if (user) {
                resolve({ "email": true, "mail": user.email })

            } else {
                resolve({ "email": false })
            }
        })
    }
    ,

    collect_all_email: () => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('student_details').find({}, { projection: { email: 1, _id: 0 } }).toArray()

            var email = user[0].email + ","

            for (var index = 1; index < user.length; index++) {
                email += user[index].email + ","

            }
            resolve(email)



        })

    },




    check_otpmail: (data) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('otps').findOne({ email: data.email })
            if (user) {
                db.get().collection('otps').updateOne({ email: data.email }, {
                    $set: {
                        otp: data.otp,
                        min: data.min,
                        hrs: data.hrs,
                        year: data.year,
                        month: data.month,
                        day: data.day
                    }
                }),
                    resolve({ status: true })
                console.log('otp updated')
            } else {
                db.get().collection('otps').insertOne(data).then((data) => {
                    console.log('new otp inserted')
                    resolve({ status: true })
                })
            }





            var transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: 'jba09156448@hotmail.com',
                    pass: 'Noufal@6448'
                }
            });

            let stringotp = data.otp.toString();

            var mailOptions = {
                from: 'jba09156448@hotmail.com',
                to: data.email,
                subject: 'Password changing OTP',
                text: stringotp + 'this is the OTP for changing password in student account ,OTP is vaild for only 10 minutes',
                html: '<h1>' + stringotp + '</h1><br><h3> is the OTP for change password in student account ,valid for only 10 minutes. OTPs are secret. Therefore, do not disclose this to anyone.<br><h4>Team JB 👽</h3>'
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }

            });



        })
    },


    retrive_otp: (data) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('otps').findOne({ otp: data })
            if (user) {

                resolve(user)
            } else {
                resolve({ nootp: true })
            }

        })


    },


    resetpass_otp: (data) => {


        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('student_details').findOne({ email: data.email })
            if (user) {
                data.password = await bcrypt.hash(data.password, 10)
                db.get().collection('student_details').updateOne({ email: data.email }, {
                    $set: {

                        password: data.password
                    }
                }),

                    resolve({ updated: true })
            } else {
                resolve({ nootp: true })
            }

        })
    },


    marks: (userdata) => {


        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('admin_check').findOne({ email: userdata.email })
            if (user) {
                //console.log(user)
                resolve({ "admin_existed": true })
            } else {
                userdata.password = await bcrypt.hash(userdata.password, 10)
                db.get().collection('admin_check').insertOne(userdata).then((data) => {
                    // console.log(userdata)
                    //console.log(data)
                    resolve(data)
                })

            }

        })
    },
    find_with_course_year_and_course: (data) => {
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('student_details').
                find({ course: data.course, startyear: data.startyear }).toArray()


            if (user) {

                resolve(user)
            } else {
                resolve({ no_user: true })
            }





        })

    },


    adding_subject: (data) => {
        console.log(data)

        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('sem_subjects').findOne({ course: data.course, sem: data.sem })
            if (user) {
                db.get().collection('sem_subjects').updateOne({ sem: data.sem }, {
                    $set: {
                        sub1: data.sub1,
                        sub2: data.sub2,
                        sub3: data.sub3,
                        sub4: data.sub4,
                        sub5: data.sub5,
                        sub6: data.sub6,

                    }
                })
                console.log('subject updated')
                resolve({ updated: true })
            } else {
                db.get().collection('sem_subjects').insertOne(data).then((response) => {
                    resolve(response)
                })
            }



        })
    },

    retrive_subjects: (data) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('sem_subjects').findOne({ sem: data.sem, course: data.course })
            if (user) {
                user.subjects = true
                resolve(user)
            } else {
                resolve({ nosubjects: true })
            }

        })
    },


    adding_marks: (data) => {
        // console.log(data)

        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('sem_marks').findOne({
                "$and": [
                    { "sem": data.sem },
                    { "id": data.id }
                ]
            })
            console.log(user)
            if (user) {
                db.get().collection('sem_marks').updateOne({ id: data.id }, {
                    $set: {
                        sub1: data.sub1,
                        sub2: data.sub2,
                        sub3: data.sub3,
                        sub4: data.sub4,
                        sub5: data.sub5,
                        sub6: data.sub6,
                        sub1int: data.sub1int,
                        sub2int: data.sub2int,
                        sub3int: data.sub3int,
                        sub4int: data.sub4int,
                        sub5int: data.sub5int,
                        sub6int: data.sub6int,
                        percentage: data.percentage,
                        total: data.total,

                    }
                })
                console.log('mark updated')
                resolve({ updated: true })
            } else {
                db.get().collection('sem_marks').insertOne(data).then((response) => {
                    resolve(response)
                })
            }



        })
    },

    retrive_marks: (data) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection('sem_marks').findOne({ id: data.id, sem: data.sem })
            if (user) {
                user.status = true
                resolve(user)
            } else {
                resolve({ nomarks: true })
            }

        })
    },


    add_principal: (data) => {

        console.log(data)
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('principal').findOne({ email: data.email })
            if (user) {

                resolve({ user: true })
            } else {

                db.get().collection('principal').insertOne(data).then((response) => {
                    resolve(response)
                })
            }
        })

    },


    add_principal_password: (data) => {

        console.log(data)

        return new Promise(async (resolve, reject) => {
            let pass = await bcrypt.hash(data.password, 10)
            let user = await db.get().collection('principal').findOne({ email: data.email })
            if (user) {
                if (user.password_set) {
                    resolve({ user_existed: true })

                } else {
                    db.get().collection('principal').updateOne({ email: data.email }, {
                        $set: {
                            password_set: true,
                            password: pass,
                        }
                    })
                    resolve({ pass_added: true })

                }

            } else {


                resolve({ no_email: true })

            }
        })

    },


    get_details_principal: () => {


        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('principal').find().toArray()
            if (user) {

                resolve(user)
            } else {

                resolve({ no_details: true })
            }
        })

    },
    delete_principal: (data) => {


        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection('principal').deleteOne({ _id: data.id })


            resolve(user)



        })

    },


    get_payment_details_all_manager: (data) => {


        return new Promise(async (resolve, reject) => {


            let details = await db.get().collection('receved_payment').find({ course: data.course, startyear: data.startyear }).toArray()

            if (details) { resolve(details) }
            else {

                resolve({ no_details: true })
            }


            //console.log(details)


        })


    },


}
