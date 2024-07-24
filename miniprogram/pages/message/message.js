// pages/message/message.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list:[],
    nomore:false,
    page:0,
    loading:true,
    likeCount:0,
    shoucangCount:0,
    pinglunCount:0,

    pinglunShow:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
      this.getMessageCount()
      //获取被回复的评论列表
      this.getpinglunList()
  },
  //获取用户输入的评论内容
  inputPinglun(e){
    this.setData({
      content:e.detail.value
    })
  },
  //限制只能上传一张评论图片
  async chooseImg(){
    const res = await wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      camera: 'back',
    })
    wx.showLoading({
      title: '上传中',
    })
    let cloudPath = "pinglunImg/" + new Date().getTime() +"-"+ Math.floor(Math.random() * 1000)+'.png';
    const urlData = await this.uploadFile(cloudPath,res.tempFiles[0].tempFilePath)
    let imgArr = []
    imgArr.push(urlData.fileID)
    this.setData({
      pinglunImgList:imgArr
    })
    wx.hideLoading()
  },
  //清除评论图片
  DelImg(){
      this.setData({
        pinglunImgList:[]
      })
  },
  //回复评论
  async sendPinglun(){
    if(this.data.content==''||!this.data.content){
      wx.showToast({
        title: '请先输入评论',
        icon:'none'
      })
      return false
    }
    let obj = {}
    obj.content = this.data.content
    obj.avatarUrl = app.globalData.avatarUrl
    obj.nickName = app.globalData.nickName
    obj.img = this.data.huifuData.img  //封面
    obj.pinglunImg = this.data.pinglunImgList
    obj.shuoid = this.data.huifuData.shuoid
    obj.creat = new Date().getTime()
    obj.toContent = this.data.huifuData.content
    obj.toOpenid = this.data.huifuData._openid
    obj.toNickName = this.data.huifuData.nickName
    obj.readEnd = false
    obj.type = 2
    obj.shuoContent = ''
    await db.collection('pinglun').add({
      data:{
        ...obj
      }
    })
    wx.showToast({
      title: '回复成功',
      icon:'success',
    })
    this.setData({
      content:'',
      pinglunImgList:[], 
      focus:false,  //关闭输入聚焦
      pinglunShow:false,
    })
  },
    //关闭发布评论的窗口
    closePinglun(){
      this.setData({
        pinglunImgList:[],
        pinglunShow:false,
        content:'',
        focus:false
      })
    },
  //上传文件到云存储
  async uploadFile(cloudPath,filePath){
    return await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
     });
  },
  //回复消息
  addhuifu(e){
     console.log(e)
     let huifuData =  e.currentTarget.dataset.item
     this.setData({
          huifuData:huifuData,
          pinglunShow:true,
          focus:true  //聚焦输入，弹出键盘
     })
  },
  //获取被回复的评论列表
  async getpinglunList(){
     const res = await db.collection('pinglun').where({
       toOpenid:app.globalData.openid
     }).orderBy('creat','desc').limit(20).get()
     this.setData({
       list:res.data,
       nomore:res.data.length<20?true:false,
     })
     if(res.data.length==0){
       return false;
     }
     //更新未读消息
     await this.updateReadEnd('pinglun',res.data)
  },
  async updateReadEnd(database,data){
    //寻找未读消息的id数组
    const updateArr = data.filter(item=>!item.readEnd).map(obj => { 
        return obj._id
     });
     console.log(updateArr)
     //无未读消息，则无需去更新数据
     if(updateArr.length==0){
       return false
     }
     await db.collection(database).where({
       _id:_.in(updateArr)
     }).update({
       data:{
         readEnd:true
       }
     })
  },
  //获取被点赞列表
  async getLikeList(){
    const res = await db.collection('like').where({
      toOpenid:app.globalData.openid
    }).orderBy('creat','desc').limit(20).get()
    this.setData({
      list:res.data,
      nomore:res.data.length<20?true:false,
    })
    if(res.data.length==0){
      return false;
    }
    //更新未读消息
    await this.updateReadEnd('like',res.data)
  },
  //获取被收藏列表
  async getShoucangList(){
    const res = await db.collection('shoucang').where({
      toOpenid:app.globalData.openid
    }).orderBy('creat','desc').limit(20).get()
    this.setData({
      list:res.data,
      nomore:res.data.length<20?true:false,
    })
    if(res.data.length==0){
      return false;
    }
    //更新未读消息
    await this.updateReadEnd('shoucang',res.data)
  },
  //导航切换
  tabChange(e){
    let index = e.detail.index
    //重新获取最新的未读消息情况
    this.getMessageCount()
    this.setData({
      tabId:index
    })
    switch (index) {
      case 0:
        //获取被回复的评论列表
        this.getpinglunList()
        break;
      case 1:
        //获取被点赞的列表
        this.getLikeList()
        break; 
      case 2:
        //获取被收藏的列表
        this.getShoucangList()
        break;   
      default:
        break;
    }
  },
  //获取信息数量
  async getMessageCount(){
      const res = await wx.cloud.callFunction({
        name:'getList',
        data:{
          $url:'getMessageCount',
        }
      })
      this.setData({
        likeCount:res.result.list[0].likeCount,
        pinglunCount:res.result.list[0].pinglunCount,
        shoucangCount:res.result.list[0].shoucangCount,
        loading:false
      })
  },
  //获取更多说说数据
  async getMore(){
    if (this.data.nomore || this.data.list.length < 20) {
      wx.showToast({
        title: '没有更多了',
      })
      return false
    }
    let page = this.data.page + 1;
    const database = this.data.tabId=0?'pinglun':this.data.tabId=1?'like':'shoucang'
    const res = await db.collection(database).where({
      toOpenid:app.globalData.openid
    }).orderBy('creat','desc').skip(page * 20).limit(20).get()
    this.setData({
      list:this.data.list.concat(res.data),
      nomore:res.data.length<20?true:false,
      page: page,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
     this.getMore()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})