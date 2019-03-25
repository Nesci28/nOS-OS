// Dependancies
const cp = require('child_process');
const info = require('./getInfo.js');


if (process.argv[process.argv.length - 1] == 'help') {
  console.log("help   : shows this commands list\n")
  console.log("stats  : shows the streaming information of the system")
  console.log("stop   : stops nOS and the miners")
  console.log("start  : starts nOS and the miners")
  console.log("gpu    : shows GPU stats")
  console.log("miner  : shows the logs of the miners")
}

if (process.argv[process.argv.length - 1] == 'stats') {
  cp.execSync('pm2 logs 0')
}

if (process.argv[process.argv.length - 1] == 'stop') {
  console.log('Turning OFF nOS')
  kill()
}

if (process.argv[process.argv.length - 1] == 'start') {
  console.log('Turning ON nOS')
  kill()
  cp.execSync(`cd ${findnOS()}; pm2 start LaunchPad.js -- init`)
}

if (process.argv[process.argv.length - 1] == 'gpu' || process.argv[process.argv.length - 1] == 'miner') {
  (async() => {
    let json = await info('running')
    console.log(json)
    if (process.argv[process.argv.length - 1] == 'gpu') {
      if (json.Nvidia.GPU.Length > 0) console.log(json.Nvidia.GPU)
      if (json.Amd.GPU.Length > 0) console.log(json.Amd.GPU)
    }

    if (process.argv[process.argv.length - 1] == 'miner') {
      if (json.Nvidia["Miner Log"] !== undefined || json.Nvidia["Miner Log"] !== null) console.log(json.Nvidia["Miner Log"])
      if (json.Amd["Miner Log"] !== undefined || json.Amd["Miner Log"] !== null) console.log(json.Amd["Miner Log"])
    }
  })()
}


function kill() {
  cp.execSync(`cd ${findnOS()}; node LaunchPad.js stop`)
}

function findnOS() {
  return cp.execSync('sudo find /home -name nOS').toString().trim()
}
