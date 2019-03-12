// const info = require('./getInfo.js')
// const watchdog = require('./WatchDog.js')
const temperature = require('./TempController.js')

// setInterval(async () => {
// 	console.log(await info.Nvidia.GPU)
// }, 1000)

// setInterval(async () => {
// 	console.log(await watchdog.Watchdog)
// }, 1000)

setInterval(async () => {
	console.log(await temperature.Temperature)
}, 1000)