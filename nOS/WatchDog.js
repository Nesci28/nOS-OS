module.exports = async function(json, step) {
  // Dependancies
  const fs = require('fs')
  const cp = require('child_process')

  // Setup
  const maxTemp = require('../Overclocks.json')

  const utilization = []
  const coreClock = []
  const memClock = []
  const temperature = []

  // Exporting watchdog result
  let watchdogStatus = {
    "Watchdog": {
      "Nvidia": {
        "Utilization": null,
        "Core": null,
        "Mem": null,
        "Temperature": null
      },
      "Amd": {
        "Utilization": null,
        "Core": null,
        "Mem": null,
        "Temperature": null
      }
    }
  }

  if (step == "init") {
    if (json.Nvidia.GPU.length > 0) {
      watchdogStatus["Watchdog"]["Nvidia"]["Utilization"] = "Initializing"
      watchdogStatus["Watchdog"]["Nvidia"]["Core"] = "Initializing"
      watchdogStatus["Watchdog"]["Nvidia"]["Mem"] = "Initializing"
      watchdogStatus["Watchdog"]["Nvidia"]["Temperature"] = "Initializing"
    }

    if (json.Amd.GPU.length > 0) {
      watchdogStatus["Watchdog"]["Amd"]["Utilization"] = "Initializing"
      watchdogStatus["Watchdog"]["Amd"]["Core"] = "Initializing"
      watchdogStatus["Watchdog"]["Amd"]["Mem"] = "Initializing"
      watchdogStatus["Watchdog"]["Amd"]["Temperature"] = "Initializing"
    }
  }

  if (step !== "init") {
    await getTemp(json)
    await getMemClock(json)
    await getCoreClock(json)
    await getUtilization(json)
  }
  return watchdogStatus

  async function getTemp(infos) {
    if (infos["Nvidia"]["GPU"].length > 0) {
      if (await getGPUTemp(infos, "Nvidia")) return true
    }
    if (infos["Amd"]["GPU"].length > 0) await getGPUTemp(infos, "Amd")
    
    function getGPUTemp(infos, brand) {
      for (let i = 0; i < infos[brand]["GPU"].length; i++) {
        let gpuTemperature = infos[brand]["GPU"][i.toString()]["Temperature"]    
        if (gpuTemperature < maxTemp[brand]["Max Temperature"]) {
          temperature[i] = 0
        } else if (gpuTemperature > maxTemp[brand]["Max Temperature"] + 10) {
          if (temperature[i] == null) {
            temperature[i] = 1
          } else {
            temperature[i]++
          }
          if (temperature[i] == 3) {
            restart("maxTemp")
          } else {
            watchdogStatus["Watchdog"][brand]["Temperature"] = false
          }
        }
      }
      watchdogStatus["Watchdog"][brand]["Temperature"] = true
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
        let gpuMemClockMax = infos[brand]["GPU"][i.toString()]["Max Mem"].split(' ')[0] - 300
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
            watchdogStatus["Watchdog"][brand]["Mem"] = false
          }
        }
      }
      watchdogStatus["Watchdog"][brand]["Mem"] = true
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
        let gpuCoreClockMax = infos[brand]["GPU"][i.toString()]["Max Core"].split(' ')[0] - 300
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
            watchdogStatus["Watchdog"][brand]["Core"] = false
          }
        }
      }
      watchdogStatus["Watchdog"][brand]["Core"] = true
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
        if (brand == "Nvidia") {
          var gpuUtils = infos[brand]["GPU"][i.toString()]["Utilization"].split(' ')[0]
        }
        if (brand == "Amd") {
          var gpuUtils = infos[brand]["GPU"][i.toString()]["Utilization"].toString()
        }
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
            watchdogStatus["Watchdog"][brand]["Utilization"] = false
          }
        }
      }
      watchdogStatus["Watchdog"][brand]["Utilization"] = true
    }
  }

  async function restart(reason, gpuPosition) {
    if (reason == "utils") {
      fs.writeFileSync("../Logs/WatchDog.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Utilization is too low")
    } else if (reason == "coreClock") {
      fs.writeFileSync("../Logs/WatchDog.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Core Clock is too low")
    } else if (reason == "memClock") {
      fs.writeFileSync("../Logs/WatchDog.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Mem Clock is too low")
    } else if (reason == "maxTemp") {
      fs.writeFileSync("../Logs/WatchDog.txt", new Date().getTime() + " - GPU : " + gpuPosition + " - Temperature is too high")
    }
    // await cp.execSync('sudo shutdown -r now')
  } 
}