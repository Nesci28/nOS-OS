// Dependancies
const cp = require('child_process')

// Setup
const info = require('./getInfo.js')
const maxTemp = require('../Overclocks.json')

// Exporting watchdog result
let temperatureStatus = {
  "Temperature": {
    "Nvidia": null,
    "Amd": null
  }
}
module.exports = temperatureStatus

async function main() {   
  let json = await info

  if (infos["Nvidia"]["GPU"].length > 0) {
    let fanCommand = await getGPUTemp(infos, "Nvidia")
    if (fanCommand) cp.execSync(fanCommand)
  }
  if (infos["Amd"]["GPU"].length > 0) await getGPUTemp(infos, "Amd")

  async function getGPUTemp(infos, brand) {
    if (brand == "Nvidia") {
      let fanCommand = ''
      maxTemp = maxTemp["Max Temperature"] + 3
      minTemp = maxTemp["Max Temperature"] - 3
      for (let i = 0; i < infos["Nvidia"]["GPU"].length; i++) {
        currentFanSpeed = infos["Nvidia"]["GPU"][i.toString()]["Fan Speed"]
        if (infos["Nvidia"]["GPU"][i.toString()]["Temperature"] < minTemp) {
          fanCommand += 'nvidia-settings -a [fan:' + i + ']/GPUTargetFanSpeed=' + currentFanSpeed - 5
        } else if (infos["Nvidia"]["GPU"][i.toString()]["Temperature"] > maxTemp) {
          fanCommand += 'nvidia-settings -a [fan:' + i + ']/GPUTargetFanSpeed=' + currentFanSpeed + 5
        }
      }
      temperatureStatus["Temperature"]["Nvidia"] = fanCommand
      return fanCommand
    }
  }
}

(async() => {
  let gpuNumber = cp.execSync('nvidia-smi --query-gpu=gpu_name --format=noheader,csv | wc -l').toString().trim()
  await initialize(gpuNumber)  
  temperatureStatus["Temperature"] = "Initializing"
})()
setInterval(async () => {
  temperatureStatus["Temperature"] = await main()
}, 10000)


async function initialize(gpuNumber) {
  let initCommand = ''
  for (let i = 0; i < gpuNumber; i++) {
    initCommand += 'nvidia-settings -a [gpu:' + i + ']/GPUFanControlState=1 -a [fan:' + i +']/GPUTargetFanSpeed=80 '
  }
  cp.execSync(initCommand)
}