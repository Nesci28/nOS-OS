const cp = require('child_process');

const info = require('./getInfo.js');
const powerControl = require('./PowerController.js');
const ocControl = require('./OverclockController.js');
const tempControl = require('./FanController.js');
const coins = require('./Coins.js');
const watchdog = require('./WatchDog.js');
const DB = require('./DB.js');
const shellinabox = require('./shellinabox.js')
// const showUI = require('./UI.js');
const util = require('util');

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
      } catch {} 
    }
    try{
      PID = cp.execSync('pidof shellinaboxd')
      PID = PID.split(' ')[0]
      if (PID) cp.execSync(`kill ${PID}`)
    } catch {}
  })()
}


if (process.argv[process.argv.length - 1] !== 'stop') {
  (async() => {
    await launchPad('init')
  })()
}

async function launchPad(step, coin, power, overclocks, database = '', json = '', shell = '') {
  process.stdout.write('\033c');
  json = await info(step, json)

  if (step == 'init') {
    shell = await shellinabox(json)
    json.Shellinabox = shell.Shellinabox.URL
    power = await powerControl(json, step)
    overclocks = await ocControl(json, step)
    coin = await coins(json)
  }
  console.log(shell)
  console.log(util.inspect(coin, false, null, true))
  console.log(util.inspect(power, false, null, true))
  if (overclocks !== undefined) console.log(util.inspect(overclocks, false, null, true))
  
  let temperature = await tempControl(json, step)
  console.log(util.inspect(temperature, false, null, true))
  
  let watch = await watchdog(json, step)
  console.log(util.inspect(watch, false, null, true))
  
  if (step !== "init") {
    var existingDB = database.DB.Entry
  }
  database = await DB(json, existingDB)
  console.log(database)
  // console.log(database.DB.Entry)
  
  // let ui = await showUI(json)
  // console.log(ui)

  setTimeout(async () => {
    await launchPad('running', coin, power, overclocks, database, json, shell)
  }, 15000)
}
