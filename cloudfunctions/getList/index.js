// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'pre-7gay81t130887f29',
  traceUser: true,
})
const TcbRouter = require('tcb-router'); //云函数路由
const db = cloud.database();
const $ = db.command.aggregate;
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
      const app = new TcbRouter({
          event
      });
      const wxContext = cloud.getWXContext()
      const openid = wxContext.OPENID;
      //获取说说列表
      app.router('getShuoList', async(ctx) => {
        ctx.body = await db.collection('shuoshuo')
        .aggregate()
        .match({
          content:_.neq('该内容已违规，暂不展示'),
          show:true
        })
        .lookup({
          from: 'like',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'likeList'
        })
        .lookup({
          from: 'pinglun',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'pinglunList'
        })
        .lookup({
          from: 'shoucang',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'shoucangList'
        })
        .lookup({
          from: 'view',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'viewList'
        })
        .addFields({
          likeCount: $.size('$likeList'),
          pinglunCount: $.size('$pinglunList'),
          shoucangCount: $.size('$shoucangList'),
          viewCount: $.size('$viewList')
        })
        .project({
          isLike: $.cond({
            if: $.in([openid,'$likeList._openid']), //需要使用对象数组的查找方法。
            then: true,
            else: false
          }),
          isShoucang: $.cond({
            if: $.in([openid,'$shoucangList._openid']),
            then: true,
            else: false
          }),
          isView: $.cond({
            if: $.in([openid,'$viewList._openid']),
            then: true,
            else: false
          }),
          nickName:1,
          avatarUrl:1,
          fileList:1,
          content:1,
          creat:1,
          show:1,
          likeCount: 1,
          pinglunCount: 1,
          shoucangCount: 1,
          viewCount: 1,
          _openid:1
        })
        .sort({
          creat: -1,
        })
        .limit(20)
        .skip(event.page * 20)
        .end()
      });
      //获取我的说说列表
      app.router('getMyShuoList', async(ctx) => {
        ctx.body = await db.collection('shuoshuo')
        .aggregate()
        .match({
            _openid:event.openid
        })
        .lookup({
          from: 'like',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'likeList'
        })
        .lookup({
          from: 'pinglun',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'pinglunList'
        })
        .lookup({
          from: 'shoucang',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'shoucangList'
        })
        .lookup({
          from: 'view',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'viewList'
        })
        .addFields({
          likeCount: $.size('$likeList'),
          pinglunCount: $.size('$pinglunList'),
          shoucangCount: $.size('$shoucangList'),
          viewCount: $.size('$viewList')
        })
        .project({
          isLike: $.cond({
            if: $.in([openid,'$likeList._openid']), //需要使用对象数组的查找方法。
            then: true,
            else: false
          }),
          isShoucang: $.cond({
            if: $.in([openid,'$shoucangList._openid']),
            then: true,
            else: false
          }),
          isView: $.cond({
            if: $.in([openid,'$viewList._openid']),
            then: true,
            else: false
          }),
          nickName:1,
          avatarUrl:1,
          fileList:1,
          content:1,
          creat:1,
          likeCount: 1,
          pinglunCount: 1,
          shoucangCount: 1,
          viewCount: 1,
          show:1,
          _openid:1
        })
        .sort({
          creat: -1,
        })
        .limit(20)
        .skip(event.page * 20)
        .end()
      });
      //获取评论列表
      app.router('getPinglunList', async(ctx) => {
        ctx.body = await db.collection('pinglun')
        .aggregate()
        .match({
          shuoid:event.shuoid,
          content:_.neq('该内容已违规，暂不展示')
        })
        .lookup({
          from: 'like',
          localField: '_id',
          foreignField: 'shuoid',
          as: 'likeList'
        })
        .addFields({
          likeCount: $.size('$likeList'),
        })
        .project({
          isLike: $.cond({
            if: $.in([openid,'$likeList._openid']), //需要使用对象数组的查找方法。
            then: true,
            else: false
          }),
          nickName:1,
          avatarUrl:1,
          pinglunImg:1,
          content:1,
          toContent:1,
          toNickName:1,
          creat:1,
          likeCount: 1,
          _openid:1
        })
        .sort({
          likeCount:-1,
          creat: -1,
        })
        .skip(event.page * 20)
        .limit(20)
        .end()
      });
      //获取未读消息数量
      app.router('getMessageCount', async(ctx) => {
        ctx.body = await db.collection('user')
        .aggregate()
        .match({
          _openid:openid
        })
        .lookup({
          from: 'like',
          let: {
            userOpenid: '$_openid',
            readEnd: false
          },
          pipeline: $.pipeline()
            .match(_.expr($.and([
              $.eq(['$toOpenid', '$$userOpenid']),
              $.eq(['$readEnd', '$$readEnd'])
            ])))
            .done(),
          as: 'likeList'
        })
        .lookup({
          from: 'pinglun',
          let: {
            userOpenid: '$_openid',
            readEnd: false
          },
          pipeline: $.pipeline()
            .match(_.expr($.and([
              $.eq(['$toOpenid', '$$userOpenid']),
              $.eq(['$readEnd', '$$readEnd'])
            ])))
            .done(),
          as: 'pinglunList'
        })
        .lookup({
          from: 'shoucang',
          let: {
            userOpenid: '$_openid',
            readEnd: false
          },
          pipeline: $.pipeline()
            .match(_.expr($.and([
              $.eq(['$toOpenid', '$$userOpenid']),
              $.eq(['$readEnd', '$$readEnd'])
            ])))
            .done(),
          as: 'shoucangList'
        })
        .addFields({
          likeCount: $.size('$likeList'),
          pinglunCount: $.size('$pinglunList'),
          shoucangCount: $.size('$shoucangList'),
        })
        .addFields({
          totalCount: $.add(['$likeCount', '$pinglunCount', '$shoucangCount'])
        })
        .project({
          totalCount:1,
          likeCount:1,
          pinglunCount:1,
          shoucangCount:1,
        })
        .end()
      });
      return app.serve();
}