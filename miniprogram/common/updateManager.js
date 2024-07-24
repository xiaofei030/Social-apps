export default () => {
  //wx.canIUse判断小程序的API，回调，参数，组件等是否在当前版本可用。
  //示例：wx.canIUse('console.log')
  //wx.canIUse返回值boolean
  //以下是判断wx.getUpdateManager()是否可用
  if (!wx.canIUse('getUpdateManager')) {
    return;
  }

  //wx.getUpdateManager()不可用就会执行wx.getUpdateManager()
  //UpdateManager 对象，用来管理更新，UpdateManager 对象有很多方法
  const updateManager = wx.getUpdateManager();

  //有新版自动下载
  updateManager.onUpdateReady(function () {
    wx.showModal({
      title: '更新提示',
      content: '新版本已经准备好，是否重启应用？',
      success(res) {
        if (res.confirm) {
          // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
          updateManager.applyUpdate();
        }
      },
    });
  });
};
