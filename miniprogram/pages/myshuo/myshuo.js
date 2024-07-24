
const app = getApp();
const db = wx.cloud.database();
const $ = db.command.aggregate;
Page({

  /**
   * 页面的初始数据
   */
  data: {
       list:[],
       nomore:false,
       page:0,
       openid:'',

       loading:true,
       doRemoveList:[],
       doAddList:[],

       doRemoveScList:[],
       doAddScList:[],
       doAddViewList:[],
       focus:false,
       pinglunImgList:[],
       pinglunShow:false,

       showAvaModal:false,
       content:'',

       shuoid:'',
       clickId:'', //控制是否展示评论

       pinglunList:[],
       plNomore:false,
       plpage:0,
       
       doRemovePlList:[],
       doAddPlList:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      openid:app.globalData.openid //用于判断是否显示删除图标
    })
  },
  //隐藏说说
  async setNoShowPinglun(e){
    let item = e.currentTarget.dataset.item
    let index = e.currentTarget.dataset.index
    await db.collection('shuoshuo').doc(item._id).update({
      data:{
        show:item.show?false:true
      }
    })
    this.data.list[index].show = item.show?false:true
    wx.showToast({
      title: item.show?'已隐藏':'已取消隐藏',
      icon:'success'
    })
    this.setData({
      list:this.data.list
    })
  },
  //删除说说
  async deleteShuo(e){
    let shuoid = e.currentTarget.dataset.id
    await db.collection('shuoshuo').doc(shuoid).remove()
    wx.showToast({
      title: '删除成功',
      icon:'success'
    })
    this.getList()
  },
 
  //删除评论
  async deletePinglun(e){
     let pinglunId = e.currentTarget.dataset.id
     let shuoid = e.currentTarget.dataset.item._id
     await db.collection('pinglun').doc(pinglunId).remove()
     wx.showToast({
       title: '删除成功',
       icon:'success'
     })
    const res = await this.getpinglunList(shuoid,0)
    //添加判断点赞的变化字段
    const newArray = res.result.list.map(obj => {
      return { ...obj, change: false };
    });
    //减少评论数量
    const shuoIndex = this.data.list.findIndex(obj => obj._id==shuoid)
    this.data.list[shuoIndex].pinglunCount-=1
    this.setData({
      pinglunList:newArray,
      plNomore:res.result.list.length<20?true:false,
      list:this.data.list
    })
  },

  //添加评论
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
    obj.img = this.data.toImg  //封面
    obj.pinglunImg = this.data.pinglunImgList
    obj.shuoid = this.data.shuoid
    obj.creat = new Date().getTime()
    obj.toContent = this.data.toContent?this.data.toContent:''
    obj.toOpenid = this.data.pinglunToOpenid
    obj.toNickName = this.data.toNickName
    obj.readEnd = false
    obj.type = this.data.type
    obj.shuoContent = this.data.shuoContent?this.data.shuoContent:''
    await db.collection('pinglun').add({
      data:{
        ...obj
      }
    })
    const pinglunList = await this.getpinglunList(this.data.shuoid,0)
    //添加判断变化字段
    const newArray = pinglunList.result.list.map(obj => {
      return { ...obj, change: false };
    });
    let shuoid = this.data.shuoid  //findIndex参数是匿名函数，无法用this，所以用新变量
    let index = this.data.list.findIndex(item => item._id == shuoid); //根据说说id去查该说说id的下标，好更新评论数量
    this.data.list[index].pinglunCount+=1
    this.setData({
      pinglunList:newArray,
      plNomore:pinglunList.result.list.length<20?true:false,
      pinglunShow:false,
      content:'',
      pinglunImgList:[],
      list:this.data.list,//更新评论数量，激活渲染
      clickId:this.data.shuoid,   
      focus:false,  //关闭输入聚焦
    })

  },
  //获取评论列表
  async getpinglunList(shuoid,plpage){
    return await wx.cloud.callFunction({
      name:'getList',
      data:{
        $url:'getPinglunList',
        shuoid:shuoid,
        page:plpage
      }
    })
  },
  //获取用户输入的评论内容
  inputPinglun(e){
    this.setData({
      content:e.detail.value
    })
  },
  //打开输入评论的窗口
  addPinglun(e){
    if(!app.globalData.nickName){
      wx.showToast({
        title: '请先授权头像',
        icon:'none'
      })
      this.setData({
        showAvaModal:true
      })
      return false;
    }
    let item = e.currentTarget.dataset.item
    let pinglunItem= e.currentTarget.dataset.plitem?e.currentTarget.dataset.plitem:false
    let shuoid = item._id  //不论回复说说还是评论，shuoid都取说说id
    let pinglunToOpenid = pinglunItem?pinglunItem._openid:item._openid  //判断是回复说说还是回复评论
    let toNickName = pinglunItem?pinglunItem.nickName:'' //回复评论才需要
    let toImg = item.fileList[0]  //说说封面
    let toContent = pinglunItem?pinglunItem.content:'' //回复评论才需要
    let type = pinglunItem?2:1  //1代表评论说说，2代表回复评论
    let shuoContent = pinglunItem?'':item.content
    //是否增加浏览量过,如果没有就增加,另外，回复评论无需再判断增加浏览量，之前判断过了
    if(!item.isView){
      this.doView(item._id)
    }
    console.log(pinglunToOpenid)
    this.setData({
      shuoid:shuoid,
      pinglunToOpenid:pinglunToOpenid,
      toNickName:toNickName,
      toImg:toImg,
      showAvaModal:app.globalData.nickName?false:true,
      pinglunShow:app.globalData.nickName?true:false,
      toContent:toContent,
      focus:true,
      type:type,
      shuoContent:shuoContent
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
      })
      wx.hideLoading()
  },
   //清除评论图片
  DelImg(){
      this.setData({
        pinglunImgList:[]
      })
  },
  //关闭发布评论的窗口
  closePinglun(){
    this.setData({
      pinglunImgList:[],
      pinglunShow:false,
      content:'',
    })
  },
  //获取说说列表
  async getList(){
    const res = await wx.cloud.callFunction({
      name:'getList',
      data:{
        $url:'getMyShuoList',
        openid:app.globalData.openid,
        page:this.data.page
      },
    })
    //添加判断变化字段
    const newArray = res.result.list.map(obj => {
      return { ...obj, change: false, scChange:false };
    });
    this.setData({
      list:newArray,
      nomore:newArray.length<20?true:false,
      loading:false  //关闭加载动画
    })
    wx.stopPullDownRefresh(); //暂停刷新动作
  },
  //点击收藏处理函数
  doShoucang(e){
    if(!app.globalData.nickName){
      wx.showToast({
        title: '请先授权头像',
        icon:'none'
      })
      this.setData({
        showAvaModal:true
      })
      return false;
    }
    let item = e.currentTarget.dataset.item
    //是否增加过浏览量,如果没有就增加
    if(!item.isView){
      this.doView(item._id)
    }
    let isShoucang = item.isShoucang
    let index = e.currentTarget.dataset.index
    let shuoid = item._id
    //让收藏图标变红色
    this.data.list[index].isShoucang = isShoucang?false:true
    //判断是否是相反的，相反的才批量操作，如果点击多次，状态还是一样的，就没必要更新数据库
    this.data.list[index].scChange = !this.data.list[index].scChange
    //让收藏数量增减
    isShoucang?this.data.list[index].shoucangCount-=1 :this.data.list[index].shoucangCount+=1
     //开始存储产生要批量处理的数据
    if(isShoucang){
        //让  isShoucang=false
        //第一需要 删除收藏，添加到remove列表，
        this.data.list[index].scChange?this.data.doRemoveScList.push(shuoid):'' //如果没有变化,就没有必要去多余操作
        //第二需要查找add列表有没有，有就删除，没有就不处理
        // 找到指定元素在数组中的索引位置
        let yiindex = this.data.doAddScList.findIndex(item => item.shuoid == shuoid);
        yiindex !== -1?this.data.doAddScList.splice(yiindex, 1):''
    }else{
          //让  isShoucang=true
          //第一需要 添加收藏，添加到add列表，
          let obj = {}
          obj.nickName = app.globalData.nickName
          obj.avatarUrl = app.globalData.avatarUrl
          obj.img = item.fileList[0]
          obj.creat = new Date().getTime()
          obj.toOpenid = item._openid
          obj.shuoid = item._id
          obj.content = item.content //收藏的说说文本
          obj.type = 5  //收藏说说
          obj.shuoContent = item.content
          this.data.list[index].scChange?this.data.doAddScList.push(obj):''//如果没有变化,就没有必要去多余操作
          //第二需要查找remove列表有没有，有就删除，没有就不处理
          // 找到指定元素在数组中的索引位置
          let yiindex = this.data.doRemoveScList.indexOf(shuoid);
          yiindex !== -1?this.data.doRemoveScList.splice(yiindex, 1):''
    }
    this.setData({
      list:this.data.list,
    })
  },
  //点赞处理函数
  doLike(e){
    if(!app.globalData.nickName){
      wx.showToast({
        title: '请先授权头像',
        icon:'none'
      })
      this.setData({
        showAvaModal:true
      })
      return false;
    }
    let item = e.currentTarget.dataset.item
    //是否增加浏览量过,如果没有就增加
    if(!item.isView){
      this.doView(item._id)
    }
    let isLike = item.isLike
    let index = e.currentTarget.dataset.index
    let shuoid = item._id
    //点赞让图标变红色
    this.data.list[index].isLike = isLike?false:true
    //判断是否是相反的，相反的才批量操作，如果点击多次，状态还是一样的，就没必要操作
    this.data.list[index].change = !this.data.list[index].change
    //加减数量
    isLike?this.data.list[index].likeCount-=1 :this.data.list[index].likeCount+=1
     //开始存储产生要批量处理的数据
    if(isLike){
        //让  isLike=false
        //1、 删除点赞，添加到remove列表，
        this.data.list[index].change?this.data.doRemoveList.push(shuoid):'' //如果没有变化,就没有必要去多余操作
        //2、 查找add列表有没有，有就删除，没有就不处理
        // 找到指定元素在数组中的索引位置
        let yiindex = this.data.doAddList.findIndex(item => item.shuoid == shuoid);
        console.log(yiindex)
        yiindex !== -1?this.data.doAddList.splice(yiindex, 1):''
    }else{
          //让  isLike=true
          //1、 点赞，添加到add列表，
          let obj = {}
          obj.nickName = app.globalData.nickName
          obj.avatarUrl = app.globalData.avatarUrl
          obj.img = item.fileList[0]
          obj.creat = new Date().getTime()
          obj.toOpenid = item._openid
          obj.shuoid = item._id
          obj.content = item.content //点赞的评论或者说说
          obj.type = 3 //点赞说说
          obj.shuoContent = item.content
          this.data.list[index].change?this.data.doAddList.push(obj):''//如果没有变化,就没有必要去多余操作
          //2、 查找remove列表有没有，有就删除，没有就不处理
          // 找到指定元素在数组中的索引位置
          let yiindex = this.data.doRemoveList.indexOf(shuoid);
          console.log(yiindex)
          yiindex !== -1?this.data.doRemoveList.splice(yiindex, 1):''
    }
    this.setData({
      list:this.data.list,
    })
  },
  doPinglunLike(e){
    if(!app.globalData.nickName){
      wx.showToast({
        title: '请先授权头像',
        icon:'none'
      })
      this.setData({
        showAvaModal:true
      })
      return false;
    }
    let item = e.currentTarget.dataset.item
    let isLike = item.isLike
    let index = e.currentTarget.dataset.index
    let shuoid = item._id
    //点赞让图标变红色
    this.data.pinglunList[index].isLike = isLike?false:true
    //判断是否是相反的，相反的才批量操作，如果点击多次，状态还是一样的，就没必要操作
    this.data.pinglunList[index].change = !this.data.pinglunList[index].change
    //加减数量
    isLike?this.data.pinglunList[index].likeCount-=1 :this.data.pinglunList[index].likeCount+=1
     //开始存储产生要批量处理的数据
    if(isLike){
        //让  isLike=false
        //1、 删除点赞，添加到remove列表，
        console.log('取消点赞')
        this.data.pinglunList[index].change?this.data.doRemovePlList.push(shuoid):'' //如果没有变化,就没有必要去多余操作
        //2、 查找add列表有没有，有就删除，没有就不处理
        // 找到指定元素在数组中的索引位置
        let yiindex = this.data.doAddPlList.findIndex(item => item.shuoid == shuoid);
        yiindex !== -1?this.data.doAddPlList.splice(yiindex, 1):''
    }else{
          //让  isLike=true
          //1、 点赞，添加到add列表，
          let obj = {}
          obj.nickName = app.globalData.nickName
          obj.avatarUrl = app.globalData.avatarUrl
          obj.img = item.img
          obj.creat = new Date().getTime()
          obj.toOpenid = item._openid
          obj.shuoid = item._id
          obj.content = item.content //点赞的评论或者说说
          obj.type = 4  //点赞评论
          obj.toNickName = item.nickName
          this.data.pinglunList[index].change?this.data.doAddPlList.push(obj):''//如果没有变化,就没有必要去多余操作
          //2、 查找remove列表有没有，有就删除，没有就不处理
          // 找到指定元素在数组中的索引位置
          let yiindex = this.data.doRemovePlList.indexOf(shuoid);
          yiindex !== -1?this.data.doRemovePlList.splice(yiindex, 1):''
    }
    this.setData({
      pinglunList:this.data.pinglunList,
    })
  },
  //展示更多评论
  async toDownMore(e){
     let shuoid = e.currentTarget.dataset.id
     let plpage = this.data.plpage + 1
     const res = await this.getpinglunList(shuoid,plpage)
     //添加判断变化字段
     const newArray = res.result.list.map(obj => {
        return { ...obj, change: false };
     });
     const list = this.data.pinglunList.concat(newArray)
     this.setData({
       pinglunList:list,
       plNomore:res.result.list.length<20?true:false,
       plpage:plpage
     })
  },
  //收起评论
  shouDown(){
    this.setData({
      shuoid:'',
      pinglunList:[],
      plNomore:false,
      plpage:0,
      clickId:''
    })
  },
  //展示评论和收起评论
  async toDown(e){
      let shuoid = e.currentTarget.dataset.id
      let isView = e.currentTarget.dataset.view
      //是否增加浏览量过,如果没有就增加
      if(!isView){
        this.doView(shuoid)
      }
      const pinglunList = await this.getpinglunList(shuoid,0)
      //添加判断变化字段
      const newArray = pinglunList.result.list.map(obj => {
        return { ...obj, change: false };
      });
      this.setData({
        shuoid:shuoid, //点的是哪个
        pinglunList:newArray,
        plNomore:pinglunList.result.list.length<20?true:false,
        clickId:shuoid
      })
  },
    //预览图片
    previewImage:function(e){
      let item = e.currentTarget.dataset.item
      //是否增加浏览量过,如果没有就增加
      if(!item.isView){

        this.doView(item._id)
      }
      let url = e.currentTarget.dataset.url //预览的图片数组
      wx.previewImage({
        urls: url // 需要预览的图片http链接列表
      })    
    },
    //增加浏览量
  doView(shuoid){
    console.log(shuoid)
    let listIndex = this.data.list.findIndex(item => item._id == shuoid);
    this.data.list[listIndex].isView = true  //改为true，避免二次触发
    this.setData({
      list:this.data.list
    })
    // 找到指定元素在数组中的索引位置
    let yiindex = this.data.doAddViewList.indexOf(shuoid);
    //如果存在就没必要再继续添加浏览量
    yiindex !== -1?'':this.data.doAddViewList.push(shuoid)
    console.log(this.data.doAddViewList)
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getList()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
       //页面隐藏就去批量更新数据库
        this.doData()
  },
  async doData(){
    let uniqueArr = Array.from(new Set(this.data.doAddViewList));
    //转成对象数组，才能批量增加，所以只有（添加数组）才转
    const doAddViewList = uniqueArr.map(item=>{
      return {shuoid:item}
    })
    // 需要添加点赞记录的id数组
    const doAddList = this.data.doAddList
    // 需要添加收藏记录的id数组
    const doAddScList = this.data.doAddScList
    // 需要添加评论记录的id数组
    const doAddPlList = this.data.doAddPlList
    var cloudFunctionData = []
    //生成批量添加浏览量的数组
    this.data.doAddViewList.length>0?cloudFunctionData.push({
      url:'doAddViewList',//云函数路由参数
      list:doAddViewList//批量添加的数据
    }):''
    //生成批量添加点赞的数组
    this.data.doAddList.length>0?cloudFunctionData.push({
      url:'doAddList',
      list:doAddList
    }):''
    //生成批量添加收藏的数组
    this.data.doAddScList.length>0?cloudFunctionData.push({
      url:'doAddScList',
      list:doAddScList
    }):''
    //生成批量添加点赞的数组（评论）
    this.data.doAddPlList.length>0?cloudFunctionData.push({
      url:'doAddList',
      list:doAddPlList
    }):''
    //生成批量删除点赞的数组
    this.data.doRemoveList.length>0?cloudFunctionData.push({
      url:'deleteLike',
      list:this.data.doRemoveList
    }):''
     //生成批量删除点赞的数组（评论）
    this.data.doRemovePlList.length>0?cloudFunctionData.push({
      url:'deleteLike',
      list:this.data.doRemovePlList
    }):''
     //生成批量删除收藏的数组
    this.data.doRemoveScList.length>0?cloudFunctionData.push({
      url:'deleteShoucang',
      list:this.data.doRemoveScList
    }):''
    //如果没有需要批量处理的数据，则无需操作
    if(cloudFunctionData.length==0){
      return false;
    }
    // 构造多个调用云函数的Promise对象数组
    const promises = cloudFunctionData.map(item => {
      return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'doData',
          data: {
            $url:item.url,
            doList:item.list
          },
          success: res => {
            resolve(res.result);
          },
          fail: err => {
            reject(err);
          }
        });
      });
    });

    // 使用Promise.all()方法批量处理所有云函数调用
    await Promise.all(promises)
    this.setData({
      doRemoveList:[],
      doAddList:[],
      doRemoveScList:[],
      doAddScList:[],
      doAddViewList:[],
      doRemovePlList:[],
      doAddPlList:[],
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh:async function () {
      this.setData({
        loading:true,
        list:[],
        nomore:false,
        page:0,
        pinglunList:[],
        plNomore:false,
        plpage:0
      })
      await this.doData()
      this.getList()
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
    const res = await wx.cloud.callFunction({
      name:'getList',
      data:{
        $url:'getMyShuoList',
        openid:app.globalData.openid,
        page:page
      },
    })
    //添加判断变化字段
    const newArray = res.result.list.map(obj => {
      return { ...obj, change: false, scChange:false };
    });
    this.setData({
      list:this.data.list.concat(newArray),
      nomore:newArray.length<20?true:false,
      loading:false,
      page: page,
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
      this.getMore();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})