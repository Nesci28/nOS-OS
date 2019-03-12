const cp = require('child_process');

// const info = require('./getInfo.js');
const watchdog = require('./WatchDog.js')
const temperature = require('./TempController.js')
const sendToDB = require('./DB.js')

cp.execSync('screen -dmS coins node Coins.js');
cp.execSync('screen -dmS temp node TempController.js');
cp.execSync('screen -dmS watchdog node WatchDog.js')
cp.execSync('screen -dmS watchdog node DB.js')

setInterval(async () => {
	console.log("Temperature Controller : ", temperature.Temperature)
}, 15000)

setInterval(async () => {
	console.log("Watchdog : ", watchdog.Watchdog)
}, 15000)

setInterval(async () => {
	console.log("DB : ", sendToDB.Status)
}, 15000)