// Dependancies
const fs = require('fs')
const chalk = require('chalk')
const cp = require('child_process')

// Setup
const info = require('./getInfo.js')
const maxTemp = require('../Overlocks.json')

const utilization = []
const coreClock = []
const memClock = []
const temperature = []

async function main() {  
  let json = await info.info.v
  
  await getUtilization(json)
  await getCoreClock(json)
  await getMemClock(json)
  await getTemp(json)
}

main()
setInterval(main(), 15000)

async function getTemp(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) await getGPUTemp(infos, "Nvidia")
  if (infos["Amd"]["GPU"].length > 0) await getGPUTemp(infos, "Amd")
  
  function getGPUTemp(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuTemperature = infos[brand]["GPU"][i.toString()]["Temperature"]
      if (gpuTemperature > maxTemp["Max Temperature"]) {
        temperature[i] = 0
      } else {
        if (temperature[i] == null) {
          temperature[i] = 1
        } else {
          temperature[i]++
        }
        if (temperature[i] == 3) {
          restart("maxTemp")
        } 
      }
    }
  }
}

async function getCoreClock(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) await getGPUMemClock(infos, "Nvidia")
  if (infos["Amd"]["GPU"].length > 0) await getGPUMemClock(infos, "Amd")
  
  function getGPUMemClock(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuCoreClock = infos[brand]["GPU"][i.toString()]["Mem Clock"]
      if (gpuCoreClock > 90) {
        memClock[i] = 0
      } else {
        if (memClock[i] == null) {
          memClock[i] = 1
        } else {
          memClock[i]++
        }
        if (memClock[i] == 3) {
          restart("memClock")
        } 
      }
    }
  }
}

async function getCoreClock(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) await getGPUCoreClock(infos, "Nvidia")
  if (infos["Amd"]["GPU"].length > 0) await getGPUCoreClock(infos, "Amd")
  
  function getGPUCoreClock(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuCoreClock = infos[brand]["GPU"][i.toString()]["Core Clock"]
      if (gpuCoreClock > 90) {
        coreClock[i] = 0
      } else {
        if (coreClock[i] == null) {
          coreClock[i] = 1
        } else {
          coreClock[i]++
        }
        if (coreClock[i] == 3) {
          restart("coreClock")
        } 
      }
    }
  }
}

async function getUtilization(infos) {
  if (infos["Nvidia"]["GPU"].length > 0) await getGPUUtilization(infos, "Nvidia")
  if (infos["Amd"]["GPU"].length > 0) await getGPUUtilization(infos, "Amd")
    
  function getGPUUtilization(infos, brand) {
    for (let i = 0; i < infos[brand]["GPU"].length; i++) {
      let gpuUtils = infos[brand]["GPU"][i.toString()]["Utilization"]
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
        } 
      }
    }
  }
}

async function restart(reason, gpuPosition) {
  if (reason == "utils") {
    fs.writeFileSync("../Logs/Error Logs.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Utilization is too low")
  } else if (reason == "coreClock") {
    fs.writeFileSync("../Logs/Error Logs.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Core Clock is too low")
  } else if (reason == "memClock") {
    fs.writeFileSync("../Logs/Error Logs.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Mem Clock is too low")
  } else if (reason == "maxTemp") {
    fs.writeFileSync("../Logs/Error Logs.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Temperature is too high")
  }
  
  await cp.execSync('sudo shutdown -r now')
} 
