const cp = require('child_process');

const info = require('./getInfo.js');
const powerControl = require('./PowerController.js');
const ocControl = require('./OverclocksController.js');
const tempControl = require('./FanController.js');
const coins = require('./Coins.js');
const watchdog = require('./WatchDog.js');
const DB = require('./DB.js');

minerName = ["minerNvidia", "minerAmd", "minerCpu"]

if (process.argv[process.argv.length - 1] == 'stop') {
  (async() => {
    let json = await info()

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

async function launchPad(step, power, overclocks) {
  process.stdout.write('\033c');
  let json = await info()

  if (step == 'init') {
    power = await powerControl(json, step)
    overclocks = await ocControl(json, step)
    let coin = await coins(json)
    console.log(coin)
  }
  console.log(power)
  if (overclocks !== undefined) console.log(overclocks)

  let temperature = await tempControl(json, step)
  console.log(temperature)

  let watch = await watchdog(json, step)
  console.log(watch)

  let database = await DB(json)
  console.log(database)

  setTimeout(async () => {
    await launchPad('running', power, overclocks)
  }, 15000)
}





  // setInterval(async () => {
  //   json = await info()
  // }, 15000)

  // setInterval(async () => {
  //   let power = await powerControl(json)
  //   console.log(power)
  // }, 15100)

  // setInterval(async () => {
  //   console.log(overclocks)
  // }, 15200)

  // setInterval(async () => {
  //   let temperature = await tempControl(json)
  //   console.log(temperature)
  // }, 15300)

  // setInterval(async () => {
  //   let watch = await watchdog(json)
  //   console.log(watch)
  // }, 15400)

  // setInterval(async () => {
  //   let database = await DB(json)
  //   console.log(database)
  // }, 15500)
// }