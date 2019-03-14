const cp = require('child_process');

const info = require('./getInfo.js');
const powerControl = require('./PowerController.js');
const tempControl = require('./TemperatureController.js');
const coins = require('./Coins.js');
const watchdog = require('./WatchDog.js');
const DB = require('./DB.js');

minerName = ["minerNvidia", "minerAmd", "minerCpu"]

if (process.argv[process.argv.length - 1] == 'stop') {
  (async() => {
    let json = await info()

    let temperature = await tempControl(json, "stop")
    console.log(temperature)

    for (let name of minerName) {
      try {
        let PID = cp.execSync(`screen -ls ${name}`).toString().trim().split("\n")[1].trim().split('.')[0]
        if (PID) cp.execSync(`kill ${PID}`)
      }
      catch {
      } 
    }    
  })()
}


if (process.argv[process.argv.length - 1] !== 'stop') {
  (async() => {
    await launchPad()
  })()
}

async function launchPad() {
  let json = await info()

  let power = await powerControl(json, process.argv[process.argv.length - 1])
  console.log(power)

  let temperature = await tempControl(json, process.argv[process.argv.length - 1])
  console.log(temperature)

  let coin = await coins(json)
  console.log(coin)

  let watch = await watchdog(json, process.argv[process.argv.length - 1])
  console.log(watch)

  let database = await DB(json)
  console.log(database)

  setInterval(async () => {
    process.stdout.write('\033c');
    json = await info()
  }, 10000)

  setInterval(async () => {
    let temperature = await tempControl(json)
    console.log(temperature)
  }, 10001)

  setInterval(async () => {
    let watch = await watchdog(json)
    console.log(watch)
  }, 10002)

  setInterval(async () => {
    let database = await DB(json)
    console.log(database)
  }, 10003)
}