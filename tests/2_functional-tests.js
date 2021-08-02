const chaiHttp = require('chai-http')
const chai = require('chai')
const assert = chai.assert
const server = require('../server')

chai.use(chaiHttp);
suite('Functional Tests', () => {
  let threadIdHolder
  let replyIdHolder
  let postManTestID
  const Chaipassword = 'chai'
   test('Create New Thread', (done)=>{
    chai
    .request(server)
		.post('/api/threads/test')
		.send({
			//board: 'test',
			text: 'Functional Test Thread',
			delete_password: Chaipassword
		})
		.end((err, res) => {
			assert.equal(res.status, 200)
			threadIdHolder = res.redirects[0].split('/')[res.redirects[0].split('/').length - 1]
			done()
		})
   })
  test('Create New Reply', (done)=>{
     chai
     .request(server)
     .post('/api/replies/test')
     .send({
       thread_id: threadIdHolder,
       text:'this is a test of the...',
       delete_password: Chaipassword
     })
     .end((err, res)=>{
       assert.equal(res.status,200)
       replyIdHolder = res.redirects[0].split('=')[res.redirects[0].split('=').length - 1]
       done()
     })
   })
   test('Get Thread', (done)=>{
     chai
      .request(server)
      .get('/api/threads/postmanTests')
      .end((err,res)=>{
        assert.equal(res.status,200)
        assert.isAtMost(res.body.length,10)
        assert.isAbove((Date.parse(res.body[0].bumped_on)-Date.parse(res.body[1].bumped_on)),0)
        assert.isAtMost(res.body[0].replies.length,3)
        assert.equal(res.body[0].reported,undefined)
        postManTestID = res.body[0]._id
      done()
      })
   })
   
   test('Get replies',(done)=>{
     chai
      .request(server)
      .get('/api/replies/postmanTests')
      .query({thread_id:postManTestID})
      .send()
      .end((err,res)=>{
         assert.equal(res.status,200)
         assert.isUndefined(res.body.delete_password)
         assert.isUndefined(res.body.reported)
       done()
     })
  })
   test('Put report thread',(done)=>{
     chai
      .request(server)
      .put('/api/threads/test')
      .send({thread_id:threadIdHolder})
      .end((err,res)=>{
        assert.equal(res.status,200)
        assert.equal(res.body, 'success')
				done()
      })
   })
   //put report reply
   test('Put report reply',(done)=>{
     chai
      .request(server)
      .put('/api/replies/test')
      .send({thread_id:threadIdHolder,reply_id:replyIdHolder})
      .end((err,res)=>{
        assert.equal(res.status,200)
        assert.equal(res.body, 'success')
				done()
      })
   })
   test('Delete thread with incorrect passwd', (done)=>{
     chai
     .request(server)
     .delete('/api/threads/test')
     .send({
       thread_id:threadIdHolder,
       delete_password: "wrongPassword"
     })
     .end((err, res)=>{
       assert.equal(res.body, 'incorrect password')
				done()
     })
   })
  test('Delete reply with incorrect passwd',(done)=>{
     chai
      .request(server)
      .delete('/api/replies/test')
      .send({thread_id:threadIdHolder,
             reply_id:replyIdHolder,
             delete_password:"wrongPassword"
             })
      .end((err,res)=>{
        assert.equal(res.status,200)
        assert.equal(res.body, 'incorrect password')
				done()
      })
   })
   test('Delete reply',(done)=>{
     chai
      .request(server)
      .put('/api/replies/test')
      .send({thread_id:threadIdHolder,
             reply_id:replyIdHolder,
             delete_password:Chaipassword
             })
      .end((err,res)=>{
        assert.equal(res.status,200)
        assert.equal(res.body, 'success')
				done()
      })
   })
   test('Delete thread', (done)=>{
     chai
     .request(server)
     .delete('/api/threads/test')
     .send({
       thread_id:threadIdHolder,
       delete_password: Chaipassword
     })
     .end((err, res)=>{
       assert.equal(res.body, 'success')
				done()
     })
   })
});
