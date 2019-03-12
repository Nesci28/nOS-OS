// Dependancies
const fs = require('fs')
const cp = require('child_process')

// Setup
const info = require('./getInfo.js')
const maxTemp = require('../Overclocks.json')

const utilization = []
const coreClock = []
const memClock = []
const temperature = []

// Exporting watchdog result
let watchdogStatus = {
  "Watchdog": undefined
}
module.exports = watchdogStatus

async function main() {   
  let json = await info
  let watchdogUtil = await getUtilization(json)
  if (!watchdogUtil) return "Utilization"
  let watchdogCore = await getCoreClock(json)
  if (!watchdogCore) return "Core"
  let watchdogMem = await getMemClock(json)
  if (!watchdogMem) return "Mem"
  let watchdogTemp = await getTemp(json)
  if (!watchdogTemp) return "Temperature"
  return true
}

(async() => {
  watchdogStatus["Watchdog"] = await main()
})()
setInterval(async () => {
  watchdogStatus["Watchdog"] = await main()
}, 10000)


async function getTemp(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) {
    if (await getGPUTemp(infos, "Nvidia")) return true
  }
  if (infos["Amd"]["GPU"].length > 0) await getGPUTemp(infos, "Amd")
  
  function getGPUTemp(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuTemperature = infos[brand]["GPU"][i.toString()]["Temperature"]    
      if (gpuTemperature < maxTemp["Max Temperature"]) {
        temperature[i] = 0
      } else {
        if (temperature[i] == null) {
          temperature[i] = 1
        } else {
          temperature[i]++
        }
        if (temperature[i] == 3) {
          restart("maxTemp")
        } else {
          return false
        }
      }
    }
    return true
  }
}

async function getMemClock(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) {
    if (await getGPUMemClock(infos, "Nvidia")) return true
  }
  // if (infos["Amd"]["GPU"].length > 0) await getGPUMemClock(infos, "Amd")
  
  function getGPUMemClock(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuMemClock = infos[brand]["GPU"][i.toString()]["Mem Clock"].split(' ')[0]
      let gpuMemClockMax = infos[brand]["GPU"][i.toString()]["Max Mem"].split(' ')[0] - 200
      if (gpuMemClock > gpuMemClockMax) {
        memClock[i] = 0
      } else {
        if (memClock[i] == null) {
          memClock[i] = 1
        } else {
          memClock[i]++
        }
        if (memClock[i] == 3) {
          restart("memClock")
        } else {
          return false
        }
      }
    }
    return true
  }
}

async function getCoreClock(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) {
    if (await getGPUCoreClock(infos, "Nvidia")) return true
  }
  // if (infos["Amd"]["GPU"].length > 0) await getGPUCoreClock(infos, "Amd")
  
  function getGPUCoreClock(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuCoreClock = infos[brand]["GPU"][i.toString()]["Core Clock"].split(' ')[0]
      let gpuCoreClockMax = infos[brand]["GPU"][i.toString()]["Max Core"].split(' ')[0] - 200
      if (gpuCoreClock > gpuCoreClockMax) {
        coreClock[i] = 0
      } else {
        if (coreClock[i] == null) {
          coreClock[i] = 1
        } else {
          coreClock[i]++
        }
        if (coreClock[i] == 3) {
          restart("coreClock")
        } else {
          return false
        }
      }
    }
    return true
  }
}

async function getUtilization(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) {
    if (await getGPUUtilization(infos, "Nvidia")) return true
  }
  if (infos["Amd"]["GPU"].length > 0) {
    if (await getGPUUtilization(infos, "Amd")) return true
  }
    
  function getGPUUtilization(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuUtils = infos[brand]["GPU"][i.toString()]["Utilization"].split(' ')[0]
      if (gpuUtils > 90) {
        utilization[i] = 0
      } else {
        if (utilization[i] == null) {
          utilization[i] = 1
        } else {
          utilization[i]++
        }
        if (utilization[i] == 3) {
          restart("utils", i)
        } else {
          return false
        }
      }
    }
    return true
  }
}

async function restart(reason, gpuPosition) {
  if (reason == "utils") {
    fs.writeFileSync("../Logs/WatchDogError.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Utilization is too low")
  } else if (reason == "coreClock") {
    fs.writeFileSync("../Logs/WatchDogError.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Core Clock is too low")
  } else if (reason == "memClock") {
    fs.writeFileSync("../Logs/WatchDogError.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Mem Clock is too low")
  } else if (reason == "maxTemp") {
    fs.writeFileSync("../Logs/WatchDogError.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Temperature is too high")
  }
  // await cp.execSync('sudo shutdown -r now')
} 
