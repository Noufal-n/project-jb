var db=require('../config/connection')
const bcrypt=require('bcrypt')
var Promise = require('promise');

module.exports={

  
     
    // signupaction:(userdata)=>{
    // return new Promise (async(resolve,reject)=>{
    
    
    // userdata.pass1= await bcrypt.hash(userdata.pass1,10)
    // db.get().collection('signup_details').insertOne(userdata).then((data)=>{
    //     console.log(data)
    //     resolve(data.insertedid) 
    // })
    
    
    
    // })
    
    // },




//   signupdetails:(details,callback)=>{
//         // console.log(details)
// db.get().collection('signup_details').insertOne(details).then((data)=>{
//   console.log(data)
//     callback(data.insertedId)
// })
   

//     },



    studentdetails:(details,callback)=>{
        //   console.log(details)
  db.get().collection('admin_check').insertOne(details).then((data)=>{
      console.log(data)
     callback(data)
  })
     
  
      }
}