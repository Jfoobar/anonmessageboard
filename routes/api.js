'use strict';
const db = require('../db')
const bcrypt = require('bcrypt')

module.exports = function (app) {
  
app.route('/api/threads/:board')
.post(async(req, res) => {
   try{
     console.log(req.params, req.body)
     req.body.board = req.params.board
	   const newThread = new db.Thread(req.body)
	   newThread.created_on = new Date().toString()
	   newThread.bumped_on = newThread.created_on
	   newThread.reported = false
	   await newThread.save()
     console.log(newThread.id +" created")
	   res.redirect(`/b/${newThread.board}/${newThread.id}`)
     }catch(error){console.log(error)}
	})
	.get(async(req, res) => {
	 const result = await db.Thread.find({board:req.params.board}).sort({bumped_on:'desc'}).lean().exec()
   for(let i = 0; i<result.length;i++){
     result[i].delete_password = undefined
     result[i].reported = undefined
     result[i].replycount = result[i].replies.length
     if (result[i].replies.length > 0){
      //remove propeties not to be sent to client
      result[i].replies = result[i].replies.reduce((acc,curr,index,arr) => {
        curr.delete_password = undefined
        curr.reported = undefined
        if(index===2) arr.splice(1)//break from reduce
        acc.push(curr)
        return acc},[])
      }
    }
   if(result.length >= 10){
    res.json(result.slice(0,-1))
   }else res.json(result)
	})
	.delete(async(req, res)=>{
    try{
      const trash = await db.Thread.findById(req.body.thread_id).exec()
      const matched = await bcrypt.compare(req.body.delete_password,trash.delete_password)
      if(matched){
        const trashed = await db.Thread.deleteOne({_id:trash.id}).exec()
        console.log(`${trash.id} was deleted`)
        res.json('success')
       }
      else res.json('incorrect password')
      }catch(error){console.log(error)}
      
  })
  .put(async (req,res)=>{
    try{
      const report = await db.Thread.findById(req.body.thread_id).exec()
      report.reported = true
      report.save()
      res.json('success')
    }catch(error){console.log(error)}
  })
  
app.route('/api/replies/:board')
.post(async(req, res) => {
   try{
	   const newReply = new db.Reply({
		 text: req.body.text,
		 delete_password: await bcrypt.hash(req.body.delete_password,10)
	   })
	   newReply.created_on = new Date().toString()
	   newReply.reported = false
     const updateThread = await db.Thread.findById(req.body.thread_id).exec()
     updateThread.replies.push(newReply)
     updateThread.bumped_on = new Date().toString()
     await updateThread.save()
     res.redirect(`/b/${updateThread.board}/${updateThread.id}?new_reply_id=${newReply.id}`)
    }catch(error){console.log(error)}
  })
  .get(async(req,res)=> {
    const result = await db.Thread.findById(req.query.thread_id).exec()
    //remove properties not to be sent back to client
    result.delete_password = undefined
    result.reported = undefined
    result.replies = result.replies.reduce((acc,curr) => {
      curr.delete_password = undefined
      curr.reported = undefined
      acc.push(curr)
      return acc},[])
	  res.json(result)
  })
.delete(async(req, res)=>{
    try{
      const searchThread = await db.Thread.findById(req.body.thread_id).exec()
	    let trashReplyI 
      searchThread.replies.filter((reply,i)=>{if(reply.id===req.body.reply_id){trashReplyI = i}})
	  if (trashReplyI == NaN){console.log("invalid reply ID");res.end}
	  const matched = await bcrypt.compare(req.body.delete_password,searchThread.replies[trashReplyI].delete_password)
      if(matched){
        searchThread.replies[trashReplyI].text = '[deleted]'
		    searchThread.save()
        res.json('success')
       }
      else res.json('incorrect password')
      }catch(error){console.log(error)}
  })
  .put(async(req, res)=>{
    try{
      const searchThread = await db.Thread.findById(req.body.thread_id).exec()
	    let updateReplyI 
      searchThread.replies.filter((reply,i)=>{if(reply.id===req.body.reply_id){updateReplyI = i}})
	    if (updateReplyI == NaN){console.log("invalid reply ID");res.end}
	    searchThread.replies[updateReplyI].reported = true
	    searchThread.save()
	    res.json('success')
      }catch(error){console.log(error)}
  })
};
