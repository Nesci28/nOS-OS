// Dependancies
const fs = require('fs');
const cp = require('child_process');
const util = require('util');
const md5File = require('md5-file');
const mv = require('mv');

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
    await stop()
    process.stdout.write('\033c');
    process.exit()
  })()
}

if (process.argv[process.argv.length - 1] !== 'stop' && process.argv[process.argv.length - 1] !== 'gpu') {
  (async() => {
    await checkXorg()
    await moveConfig()
    let counter = 0
    await launchPad('init', counter)
  })()
}

async function launchPad(step, counter, coin, power, overclocks, database = '', json = '', shell = '') {
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
    cp.execSync('urxvt -e ./tmux.sh && exit &')
    database = await DB(json, '')
  }

  
  if (step == "init" || step == "running") {
    var temperature = await tempControl(json, step)
    var watch = await watchdog(json, step)
  }
  
  if (step == "running") {
    var existingDB = database.DB.Entry
    database = await DB(json, existingDB)
  }

  if (counter == 480) {
    counter = 0
    shell = await shellinabox('shellinabox')
    json.Shellinabox = shell.Shellinabox.URL
  }
  
  // let ui = await showUI(json)
  
  // console.log(ui)
  console.log(util.inspect(coin, false, null, true))
  console.log(util.inspect(power, false, null, true))
  if (overclocks !== undefined) {
    console.log(util.inspect(overclocks, false, null, true))
  }
  console.log(util.inspect(temperature, false, null, true))
  console.log(util.inspect(watch, false, null, true))
  console.log(database)
  console.log(shell, counter)

  setTimeout(async () => {
    counter++
    await launchPad('running', counter, coin, power, overclocks, database, json, shell, counter)
  }, 15000)
}

if (process.argv[process.argv.length - 1] == 'gpu') {
  (async() => {
    let json = await info('init')
    console.log(json.Amd.GPU)
  })()
}

async function stop() {
  let json = await info('stop')

  if (json.Nvidia.GPU.length > 0) {
    let overclocks = await ocControl(json, "stop")
    console.log(overclocks)
  }

  let temperature = await tempControl(json, "stop")
  console.log(temperature)

  let shell = await shellinabox('stop')
  console.log(shell)

  cp.execSync('pm2 kill')
  cp.execSync('rm -rf ~/.pm2/logs/*')
  cp.execSync('pm2 flush')

  let pm2List = cp.execSync('ps aux | grep "pm2 logs 0" | grep "node" | sed \'s/  */ /g\' | cut -d \' \' -f2')
  pm2List = pm2List.toString().trim().split('\n')
  for (let ID of pm2List) {
    try {
      cp.execSync(`kill ${ID}`)
    }
    catch {}
  }

  for (let name of minerName) {
    try {
      let PID = cp.execSync(`screen -ls ${name}`).toString().trim().split("\n")[1].trim().split('.')[0]
      if (PID) {
        console.log(`Closing ${name}...`)
        cp.execSync(`kill ${PID}`)
      }
    } catch {} 
  }
}

function checkXorg() {
  xorgNumber = cp.execSync('cat /etc/X11/xorg.conf | grep \'Option         "Coolbits" "28"\' | wc -l').toString().trim()
  gpuNumber = cp.execSync('nvidia-smi --query-gpu=gpu_name --format=noheader,csv | wc -l').toString().trim()

  if (xorgNumber !== gpuNumber) {
    cp.execSync('sudo nvidia-xconfig -a --cool-bits 28')
    cp.execSync('sudo systemctl reboot')
  }
}

function moveConfig() {
  const files = ['Overclocks.json', 'SystemConfig.json', 'CoinsConfig.json']
  for (let file of files) {
    if (fs.existsSync(`/ntfs/${file}`)) {
      if (! checkFiles(`/home/nos/${file}`, `/ntfs/${file}`)) {
        move(`${file}`)
      }
    }
  }
}

function checkFiles(file1, file2) {
  return md5File.sync(file1) === md5File.sync(file2)
}

function move(file) {
  mv(`/ntfs/${file}`, `/home/nos/${file}`, function(err) {
    console.log(err)
  });
}