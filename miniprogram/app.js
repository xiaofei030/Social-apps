//app.js
import updateManager from './common/updateManager';
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'pre-7gay81t130887f29',
        traceUser: true,
      })
    }

    this.globalData = {
      openid:'',
      nickName:'',
      avatarUrl:'',
    }
  },
  onShow: function () {
    updateManager();
  },
})
