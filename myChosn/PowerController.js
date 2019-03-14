module.exports = async function(json, step) {
  // Dependancies
  const cp = require('child_process');

  // Setup
  const maxTemp = require('../Overclocks.json');

  let powerStatus = {
    "Power": {
      "Nvidia": [],
      "Amd": []
    }
  };

  let wattCommand = ''
  if (step == "init") {
    if (json.Nvidia.GPU.length > 0) wattCommand = initialize(json, json.Nvidia.GPU.length, "Nvidia")
    if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)

    if (json.Amd.GPU.length > 0) wattCommand = initialize(json, json.Amd.GPU.length, "Amd")
    if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)
  }

  if (step !== "init") {
    if (json.Nvidia.GPU.length > 0) wattCommand = checkCurrent(json, json.Nvidia.GPU.length, "Nvidia")
    if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)

    if (json.Amd.GPU.length > 0) wattCommand = checkCurrent(json, json.Amd.GPU.length, "Amd")
    if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)
  }

  return powerStatus


  function initialize(json, gpuNumber, brand) {
    let maxPower = maxTemp[brand]["Powerlevel_%"]
    let initCommand = ''
    let nextWatt

    for (let i = 0; i < gpuNumber; i++) {
      let minWatt = json[brand]["GPU"][i]["Min Watt"].split(' ')[0]
      let maxWatt = json[brand]["GPU"][i]["Max Watt"].split(' ')[0]
      if (brand == "Nvidia") {
        if (i == 0) initCommand += 'nvidia-smi '
        nextWatt = Math.round(Number(minWatt) + (maxWatt - minWatt) / 100 * (maxPower - 50))
        initCommand += `-i ${i} -pl ${nextWatt}`;
      }
      
      if (brand == "Amd") {
        if (i == 0) wattCommand += 'rocm-smi '
        nextWatt = 'test'
      }
      
      console.log(nextWatt)
      powerStatus["Power"][brand][i] = nextWatt
    }
    return initCommand
  }

  function checkCurrent(json, gpuNumber, brand) {
    let maxFanSpeed = maxTemp[brand]["Max FanSpeed"]
    let maxTemperature = maxTemp[brand]["Max Temperature"] + 3
    let nextWatt = json[brand]["GPU"]["Watt"] - 5
    let wattCommand = ''

    for (let i = 0; i < gpuNumber; i++) {
      let currentFanSpeed = json[brand]["GPU"][i]["Fan Speed"]
      let currentTemp = json[brand]["GPU"][i]["Temperature"]
      
      if (currentFanSpeed >= maxFanSpeed && currentTemp > maxTemperature) {
        if (brand == "Nvidia") {
          if (wattCommand = '') wattCommand += 'nvidia-smi'
          wattCommand += `-i ${i} -pl ${nextWatt}`
        }

        if (brand == "Amd") {
          if (wattCommand = '') wattCommand += 'rocm-smi'
          wattCommand += `-d ${i} --setpoweroverdrive ${nextWatt}`
        }
        powerStatus[brand][i] = nextWatt
      }
    }
  
    return wattCommand
  }
}