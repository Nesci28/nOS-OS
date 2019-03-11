const info = require('./getInfo.js')
const watchdog = require('./WatchDog.js')

// setInterval(async () => {
// 	console.log(await info.info.v)
// }, 1000)

setInterval(async () => {
	console.log(await watchdog)
}, 1000)