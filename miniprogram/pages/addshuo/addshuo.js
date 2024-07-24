// pages/addshuo/addshuo.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fileList:[],

    desc:'',
    desc_counts:0,

    showAvaModal:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  input(e) {
    let str = e.detail.text
    if(str.length>100){
      wx.showToast({
        title: '最多只能输入100个字',
        icon:'none'
      })
      return false;
    }
    const regex = /([#][^#]+([ ]))/g;
    const res = str.replace(regex, `<span style="color:blue;">$&</span>`);
    this.setData({
      code: res,
      desc:str,
      desc_counts:str.length
    })
  },
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
        showAvaModal:false,
      })
      wx.hideLoading()
   },
  check(){
    if(this.data.fileList.length==0){
      wx.showToast({
        title: '请先上传图片',
      })
      return false;
    }
    if(this.data.desc==''||!this.data.desc){
      wx.showToast({
        title: '请先输入内容',
      })
      return false;
    }
    if(!app.globalData.nickName){
      wx.showToast({
        title: '先去授权头像',
      })
      this.setData({
         showAvaModal:true
      })
      return false;
    }
    this.addshuo()
  },
  async addshuo(){
    await db.collection('shuoshuo').add({
      data:{
         creat:new Date().getTime(),
         fileList:this.data.fileList,
         content:this.data.code,
         nickName:app.globalData.nickName,
         avatarUrl:app.globalData.avatarUrl,
         show:true,
      },
    })
    wx.showToast({
      title: '发布成功',
      icon:'success'
    })
    // 获取Editor组件的上下文实例
    const query = wx.createSelectorQuery();
    query.select('#editor').context(function(res){
      const editorContext = res.context;
      editorContext.clear(); // 清空内容
    }).exec();
    this.setData({
      fileList:[],
      desc:'',
      desc_counts:0,
      code:'',
    })
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/yuleshuo/yuleshuo',
      })
    }, 500);
  },

  // 上传图片
  async uploadToCloud() {
      let linshi = []
      const res = await wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        camera: 'back',
      })
      wx.showLoading({
        title: '正在上传',
      })
      linshi = res.tempFiles.map(item=>{
        return item.tempFilePath
      })
      let cloudPath = "shuoimg/" + new Date().getTime() +"-"+ Math.floor(Math.random() * 1000)+'.png';
      const uploadTasks = linshi.map((item, index)  =>  this.uploadFile(cloudPath+index, item)); //传给wx.cloud.uploadFile的cloudPath属性的值不能重复！！！巨坑，加个index就可以避免重复了
      const uploadData = await Promise.all(uploadTasks)
      const newFileList = uploadData.map(item =>{
         return item.fileID
      });
      this.setData({ 
        fileList: this.data.fileList.concat(newFileList),
      });
      wx.hideLoading()
  },
  //上传文件到云存储
  async uploadFile(cloudPath,filePath){
    return await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
     });
  },
  //预览图片
  previewImage:function(event){
    wx.previewImage({
      urls: [event.currentTarget.dataset.url] // 需要预览的图片http链接列表
    })    
  },
  //删除图片
  delete:function(event){
    let inde = event.currentTarget.dataset.id
    //删除数组里面的值
    this.data.fileList.splice(inde,1)
    this.setData({
        fileList:this.data.fileList,
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})