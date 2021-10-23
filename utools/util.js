const os = require('os');

// 获取内网ip
function getIPAddresses() {
  let ipAddresses = [];
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4') {
        ipAddresses.push(alias.address)
      }
    }
  }
  return ipAddresses;
};

module.exports = { getIPAddresses };