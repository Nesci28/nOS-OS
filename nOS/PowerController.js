module.exports = async function(json, step) {
  // Dependancies
  const cp = require('child_process');

  // Setup
  const ocHelper = require('./helpers/HiveOverclocksAPI.js');
  const ocSettings = require('../Overclocks.json');

  let powerStatus = {
    "Power": {
      "Nvidia": [],
      "Amd": []
    }
  };


  return (async () => {
    let wattCommand = ''
    if (step == "init") {
      if (json.Nvidia.GPU.length > 0) wattCommand = await initialize(json, json.Nvidia.GPU.length, "Nvidia")
      if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)

      if (json.Amd.GPU.length > 0) wattCommand = await initialize(json, json.Amd.GPU.length, "Amd")
      if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)
    }

    if (step !== "init") {
      if (json.Nvidia.GPU.length > 0) wattCommand = await checkCurrent(json, json.Nvidia.GPU.length, "Nvidia")
      if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)

      if (json.Amd.GPU.length > 0) wattCommand = await checkCurrent(json, json.Amd.GPU.length, "Amd")
      if (wattCommand !== '') cp.execSync('sudo ' + wattCommand)
    }

    return powerStatus
  })();

  async function initialize(json, gpuNumber, brand) {
    let maxPower = ocSettings[brand]["Powerlevel_%"]
    let initCommand = ''
    let nextWatt

    for (let i = 0; i < gpuNumber; i++) {
      if (ocSettings[brand]["Use Hive_OC"]) {
        let hiveOC = await ocHelper(json[brand]["GPU"][i].Name)

        if (brand == "Nvidia") {
          if (i == 0) initCommand += 'nvidia-smi '
          if (hiveOC.power_limit) initCommand += `-i ${i} -pl ${hiveOC.power_limit}`
        }

        // if (brand == "Amd") {

        // }

        powerStatus["Power"][brand][i] = hiveOC.power_limit
      } else {
        let minWatt = json[brand]["GPU"][i]["Min Watt"].split(' ')[0]
        let maxWatt = json[brand]["GPU"][i]["Max Watt"].split(' ')[0]
        if (brand == "Nvidia") {
          if (initCommand = '') initCommand += 'nvidia-smi '
          nextWatt = Math.round(Number(minWatt) + (maxWatt - minWatt) / 100 * (maxPower - 50))
          initCommand += `-i ${i} -pl ${nextWatt}`;
        }
        
        // if (brand == "Amd") {
        //   if (initCommand = '') wattCommand += 'rocm-smi '
        //   nextWatt = 'test'
        // }
        
        powerStatus["Power"][brand][i] = nextWatt
      }
    }
    return initCommand
  }

  function checkCurrent(json, gpuNumber, brand) {
    let maxFanSpeed = ocSettings[brand]["Max FanSpeed"]
    let ocSettingserature = ocSettings[brand]["Max Temperature"] + 3
    let wattCommand = ''
    let nextWatt

    for (var i = 0; i < gpuNumber; i++) {
      let currentFanSpeed = json[brand]["GPU"][i]["Fan Speed"]
      let currentTemp = json[brand]["GPU"][i]["Temperature"]
      
      if (currentFanSpeed >= maxFanSpeed && currentTemp > ocSettingserature) {
        nextWatt = json[brand]["GPU"][i]["Watt"] - 5
        if (brand == "Nvidia") {
          if (wattCommand = '') wattCommand += 'nvidia-smi'
          wattCommand += `-i ${i} -pl ${nextWatt}`
        }

        if (brand == "Amd") {
          if (wattCommand = '') wattCommand += 'rocm-smi'
          wattCommand += `-d ${i} --setpoweroverdrive ${nextWatt}`
        }
      }
      if (nextWatt) powerStatus["Power"][brand][i] = nextWatt
      else powerStatus["Power"][brand][i] = json[brand]["GPU"][i]["Watt"]
    }
  
    return wattCommand
  }
}