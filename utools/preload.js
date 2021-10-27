const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');
const path = require('path');
const fs = require('fs');

let server;
let port = 9527;

// listen
let success = false
const app_serve = (app, _port) => {
  return new Promise((resolve, reject) => {
    app.listen(_port, '0.0.0.0', () => {
      console.log('启动成功', _port)
      success = true
      resolve(1)
    });
    setTimeout(() => {
      if (!success) reject('启动出错', _port)
    }, 2000)
  })
}

// 启动
const startServer = async () => {
  if (server) return;
  const app = new Koa();
  const router = new Router();
  // 默认重定向到index
  router.get('/', async ctx => ctx.redirect('/download.html'));
  router.get('/download/:fileName', async ctx => {
    const { fileName } = ctx.params;
    const fileString = utools.dbStorage.getItem(fileName)
    const file = fileString ? JSON.parse(fileString) : {}
    if (!file.path) {
      ctx.body = { success: false, message: '文件未设置共享' };
      return;
    }
    const exist = fs.existsSync(file.path);
    if (!exist) {
      ctx.body = { success: false, message: '文件不存在' };
      return;
    }
    console.log('下载文件', JSON.stringify(file))
    // 下载文件
    const { size } = fs.statSync(file.path);
    const createReadStream = fs.createReadStream(file.path)
    ctx.set('Content-type', 'application/force-download')
    ctx.set('Content-Length', size)
    ctx.body = createReadStream
  })
  router.get('/files', async ctx => {
    ctx.body = await values();
  })
  // 启动监听
  app.use(serve(path.join(__dirname, './web/')));
  app.use(router.routes());
  try {
    server = await app_serve(app, port)
  } catch (error) {
    port++;
    server = await app_serve(app, port)
  }
}
// 关闭服务
const stopServer = () => {
  if (server) server.close();
}
// add file
const add = async (file) => {
  delete file.recently;
  // 文件大小
  if (!file.size) {
    const stat = fs.statSync(file.path)
    file.size = stat.size;
  }
  const fileExist = fs.existsSync(file.path)
  if (!fileExist) return { success: false, message: '文件路径错误或无权限访问' };
  utools.dbStorage.setItem(file.name, JSON.stringify(file))
  // 更新列表
  const list = getList()
  const exist = list.find(o => o === file.name)
  if (!exist) list.unshift(file.name)
  setList(list)
  return { success: true, data: file.path };
}
// remove file
const remove = async (file) => {
  let list = getList()
  list = list.filter(o => o !== file.name)
  utools.dbStorage.removeItem(file.name)
  setList(list)
  return { success: true };
}
// clear
const clear = async () => {
  const list = getList()
  for (const item of list) {
    utools.dbStorage.removeItem(item)
  }
  utools.dbStorage.removeItem('files')
  return { success: true };
}
// values
const values = async () => {
  let data = []
  const list = getList()
  try {
    for (const item of list) {
      data.push(JSON.parse(utools.dbStorage.getItem(item)))
    }
  } catch (error) {
    console.error(error)
    removeItem('files')
  }
  return { success: true, data }
}
// list
const getList = () => {
  const listString = utools.dbStorage.getItem('files')
  let list = [];
  try {
    list = JSON.parse(listString);
  } catch (error) {
    utools.dbStorage.removeItem('files')
    console.error(error);
  }
  return list || [];
}
// set list
const setList = (list) => {
  utools.dbStorage.setItem('files', JSON.stringify(list))
}
const { getIPAddresses } = require('./util');

const getPort = async () => (port)

window.api = {
  startServer,
  stopServer,
  add,
  remove,
  clear,
  values,
  getIPAddresses,
  getPort
}
