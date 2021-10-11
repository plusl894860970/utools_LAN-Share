const os = require('os');

// 获取内网ip
function getIPAddress() {
  let IPAddress = '';
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address.startsWith('192.168') && !alias.internal) {
        IPAddress = alias.address;
      }
    }
  }
  return IPAddress;
};

module.exports = { getIPAddress };