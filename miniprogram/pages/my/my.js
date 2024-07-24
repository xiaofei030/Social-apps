// pages/my/my.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showAvaModal:false,
    nickName:'',
    avatarUrl:'',
    loading:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  //获取未读消息数量
  async getMessageCount(){
    const res = await wx.cloud.callFunction({
      name:'getList',
      data:{
        $url:'getMessageCount'
      }
    })
    this.setData({
      badge:res.result.list[0].totalCount,
      loading:false
    })
  },
  //打开授权窗口
  open(){
    this.setData({
      showAvaModal:true
    })
  },
  //上传文件到云存储
  async uploadFile(cloudPath,filePath){
    return await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      });
    },
  //获取用户的头像昵称
  async getAvaNickData(res){
    wx.showLoading({
      title: '正在获取',
    })
    const { avatarUrl, nickName } = res.detail
    let cloudPath = "nickimg/" + new Date().getTime() +"-"+ Math.floor(Math.random() * 1000)+'.png';
    const data = await this.uploadFile(cloudPath,avatarUrl)
    var userInfo = {
      avatarUrl:data.fileID,
      nickName:nickName
    }
    await db.collection('user').where({
     _openid:app.globalData.openid
     }).update({
         data:{...userInfo}
     })
     app.globalData.nickName = nickName
     app.globalData.avatarUrl = data.fileID
     this.setData({
       showAvaModal:false, //关闭窗口
       nickName:nickName,
       avatarUrl:data.fileID
     })
     wx.hideLoading()
  },
  //跳转消息页面
  go(e){
    let url = e.currentTarget.dataset.url
    wx.navigateTo({
      url: url,
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
    this.getMessageCount()
    if(app.globalData.nickName){
      this.setData({
        nickName:app.globalData.nickName,
        avatarUrl:app.globalData.avatarUrl
      })
    }
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})