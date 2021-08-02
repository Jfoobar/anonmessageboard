const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
.then((result) => console.log("connected to DB"))
.catch((err)=>console.log(err));

const replySchema = new mongoose.Schema({
	text: {type: String, required: true},
	delete_password: {type: String, required: true},
	created_on : {type: Date, required: true},
	reported: {type: Boolean, required: true},
})

const threadSchema = new mongoose.Schema({
	text: {type: String, required: true},
	delete_password: {type: String, required: true},
	board: {type: String, required: true},
	created_on: {type: Date, required: true},
	bumped_on: {type: Date, required: true},
	reported: {type: Boolean, required: true},
	replies: [replySchema]
})

threadSchema.pre('save',function (next){
  const thread = this
  if(thread.__v!==undefined)next()//only need to hash on initial create
  bcrypt.hash(thread.delete_password, 10, (error,hash)=>{
    thread.delete_password = hash
    next()
  })
})

const Reply = mongoose.model('Reply', replySchema)
const Thread = mongoose.model('Thread', threadSchema)

module.exports = {Reply,Thread}
