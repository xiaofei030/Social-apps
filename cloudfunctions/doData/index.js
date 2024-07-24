// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'pre-7gay81t130887f29',
  traceUser: true,
})
const TcbRouter = require('tcb-router'); //云函数路由
const db = cloud.database();
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
      const app = new TcbRouter({
          event
      });
      const wxContext = cloud.getWXContext()
      const openid = wxContext.OPENID;
      //批量添加浏览量
      app.router('doAddViewList', async(ctx) => {
        const newArray = event.doList.map(obj => {
          return { 
              ...obj, // 将原对象的属性复制到新对象
              _openid: openid // 添加新字段
          };
        });     
        ctx.body = await db.collection("view").add({
          // 直接将数组传入
          //只有云函数端可以这样，小程序端不支持
            data: newArray
          })
      });
      //批量添加点赞
      app.router('doAddList', async(ctx) => {
        const newArray = event.doList.map(obj => {
          return { 
              ...obj, // 将原对象的属性复制到新对象
              _openid: openid, // 添加新字段
              readEnd:false
          };
        });     
        ctx.body = await db.collection("like").add({
          // 直接将数组传入
          //只有云函数端可以这样，小程序端不支持
            data: newArray
          })
      });
      //批量添加收藏
      app.router('doAddScList', async(ctx) => {
        const newArray = event.doList.map(obj => {
          return { 
              ...obj, // 将原对象的属性复制到新对象
              _openid: openid, // 添加新字段
              readEnd:false
          };
        });      
        ctx.body = await db.collection("shoucang").add({
          // 直接将数组传入
          //只有云函数端可以这样，小程序端不支持
            data: newArray
          })
      });
      //批量删除点赞
      app.router('deleteLike', async(ctx) => {
        ctx.body = await db.collection('like').where({
          shuoid:_.in(event.doList),
          _openid:openid
        }).remove()
      });
      //批量删除收藏
      app.router('deleteShoucang', async(ctx) => {
       ctx.body = await db.collection('shoucang').where({
        shuoid:_.in(event.doList),
        _openid:openid
        }).remove()
      });
      return app.serve();
}