const cp = require('child_process');

const info = require('./getInfo.js');
const powerControl = require('./PowerController.js');
const ocControl = require('./OverclocksController.js');
const tempControl = require('./FanController.js');
const coins = require('./Coins.js');
const watchdog = require('./WatchDog.js');
const DB = require('./DB.js');
const showUI = require('./UI.js');

minerName = ["minerNvidia", "minerAmd", "minerCpu"]

if (process.argv[process.argv.length - 1] == 'stop') {
  (async() => {
    let json = await info('stop')

    if (json.Nvidia.GPU.length > 0) {
      let overclocks = await ocControl(json, "stop")
      console.log(overclocks)
    }

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
    await launchPad('init')
  })()
}

async function launchPad(step, coin, power, overclocks, database = '', json = '') {
  json = await info(step, json)

  if (step == 'init') {
    power = await powerControl(json, step)
    overclocks = await ocControl(json, step)
    coin = await coins(json)
    // console.log(coin)
  }
  // console.log(power)
  // if (overclocks !== undefined) console.log(overclocks)

  let temperature = await tempControl(json, step)
  // console.log(temperature)

  let watch = await watchdog(json, step)
  // console.log(watch)

  if (step !== "init") {
    var existingDB = database.DB.Entry
  }
  database = await DB(json, existingDB)
  // console.log(database)

  let ui = await showUI(json)
  process.stdout.write('\033c');
  console.log(ui)

  setTimeout(async () => {
    await launchPad('running', coin, power, overclocks, database, json)
  }, 15000)
}