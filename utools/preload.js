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
      utools.showNotification('局域网共享服务已开启, 端口: ' + _port)
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
    let resHred = readFile(ctx.headers.range, file.path);
    ctx.status = resHred.code
    ctx.set(resHred.head);
    let stream = fs.createReadStream(file.path, resHred.code == 200 ? {} : { start: resHred.start, end: resHred.end });
    stream.pipe(ctx.res);
    ctx.respond = false;
  })
  router.get('/files', async ctx => {
    ctx.body = await values();
  })
  app.use(serve(path.join(__dirname, './web/')));
  app.use(router.routes());
  // 启动监听
  const custom_port = utools.dbStorage.getItem('port')
  console.log('自定义port', custom_port)
  if (custom_port) port = parseInt(custom_port)
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
  // 文件大小
  if (!file.size) {
    const stat = fs.statSync(file.path)
    file.size = stat.size;
  }
  const fileExist = fs.existsSync(file.path)
  if (!fileExist) return { success: false, message: '文件路径错误或无权限访问' };
  const target = JSON.parse(JSON.stringify(file))
  delete target.recently;
  utools.dbStorage.setItem(file.name, JSON.stringify(target))
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


const setPort = async (port) => {
  utools.dbStorage.setItem('port', port)
}
const getPort = async () => (port)


/**
 * [读文件]
 * @param  {String} range        [数据起始位]
 * @param  {String} filePath     [文件路径]
 * @param  {Number} chunkSize    [每次请求碎片大小 （900kb 左右）]
 */
function readFile(range, filePath, chunkSize = 499999 * 2) {
  //mime类型
  const mime = {
    "css": "text/css",
    "gif": "image/gif",
    "html": "text/html",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "text/javascript",
    "json": "application/json",
    "pdf": "application/pdf",
    "png": "image/png",
    "svg": "image/svg+xml",
    "swf": "application/x-shockwave-flash",
    "tiff": "image/tiff",
    "txt": "text/plain",
    "mp3": "audio/mp3",
    "wav": "audio/x-wav",
    "wma": "audio/x-ms-wma",
    "wmv": "video/x-ms-wmv",
    "xml": "text/xml",
    "mp4": "video/mp4"
  };
  // 获取后缀名
  let ext = path.extname(filePath);
  ext = ext ? ext.slice(1) : 'unknown';
  //未知的类型一律用"text/plain"类型
  let contentType = mime[ext.toLowerCase()];

  //建立流对象，读文件
  let stat = fs.statSync(filePath)
  let fileSize = stat.size;
  let head = {
    code: 200,
    head: {
      'Content-Length': fileSize,
      'content-type': contentType,
    }

  };
  if (range) {
    // 大文件分片
    let parts = range.replace(/bytes=/, "").split("-");
    let start = parseInt(parts[0], 10);
    let end = parts[1] ? parseInt(parts[1], 10) : start + chunkSize;
    end = end > fileSize - 1 ? fileSize - 1 : end;
    chunkSize = (end - start) + 1;
    head = {
      code: 206,
      filePath,
      start,
      end,
      head: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'content-type': contentType,
        'Content-Length': chunkSize,
        'Accept-Ranges': 'bytes'
      }
    }

  }
  return head;
}

window.api = {
  startServer,
  stopServer,
  add,
  remove,
  clear,
  values,
  getIPAddresses,
  getPort,
  setPort
}
