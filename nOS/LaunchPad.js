// Dependancies
const cp = require('child_process');
const util = require('util');

// Requirements
const info = require('./getInfo.js');
const powerControl = require('./PowerController.js');
const ocControl = require('./OverclockController.js');
const tempControl = require('./FanController.js');
const coins = require('./Coins.js');
const watchdog = require('./WatchDog.js');
const DB = require('./DB.js');
const shellinabox = require('./shellinabox.js')
// const showUI = require('./UI.js');

let minerName = ["minerNvidia", "minerAmd", "minerCpu"]

if (process.argv[process.argv.length - 1] == 'stop') {
  (async() => {
    let json = await info('stop')

    if (json.Nvidia.GPU.length > 0) {
      let overclocks = await ocControl(json, "stop")
      console.log(overclocks)
    }

    let temperature = await tempControl(json, "stop")
    console.log(temperature)

    cp.execSync('pm2 kill')

    for (let name of minerName) {
      try {
        let PID = cp.execSync(`screen -ls ${name}`).toString().trim().split("\n")[1].trim().split('.')[0]
        if (PID) {
          console.log(`Closing ${name}...`)
          cp.execSync(`kill ${PID}`)
        }
      } catch {} 
    }
    process.exit()
  })()
}

if (process.argv[process.argv.length - 1] !== 'stop') {
  (async() => {
    await launchPad('init')
  })()
}

async function launchPad(step, coin, power, overclocks, database = '', json = '', shell = '') {
  if (step !== "shellinabox") {
    process.stdout.write('\033c');
    json = await info(step, json)
  }

  if (step == "init") {
    shell = await shellinabox(step)
    json.Shellinabox = shell.Shellinabox.URL
    power = await powerControl(json, step)
    overclocks = await ocControl(json, step)
    coin = await coins(json)
    database = await DB(json, existingDB)
  }

  if (step == "init" || step == "running") {
    var temperature = await tempControl(json, step)
    var watch = await watchdog(json, step)
  }
  
  if (step == "running") {
    var existingDB = database.DB.Entry
  }

  if (step == "shellinabox") {
    shell = await shellinabox(step)
    json.Shellinabox = shell.Shellinabox.URL
  }
  
  // let ui = await showUI(json)
  
  if (step !== "shellinabox") {
    // console.log(ui)
    console.log(util.inspect(coin, false, null, true))
    console.log(util.inspect(power, false, null, true))
    if (overclocks !== undefined) {
      console.log(util.inspect(overclocks, false, null, true))
    }
    console.log(util.inspect(temperature, false, null, true))
    console.log(util.inspect(watch, false, null, true))
    console.log(database)
    console.log(shell)
  }


  setTimeout(async () => {
    await launchPad('running', coin, power, overclocks, database, json, shell)
  }, 15000)

  setTimeout(async () => {
    await launchPad('shellinabox')
  }, 7200000)
}
