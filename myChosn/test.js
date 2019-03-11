const info = require('./getInfo.js')

setInterval(async () => {
	console.log(await info.info.v.Nvidia.GPU)
}, 1000)