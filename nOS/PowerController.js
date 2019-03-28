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
      // if (wattCommand !== '') cp.execSync(wattCommand)

      if (json.Amd.GPU.length > 0) wattCommand = await initialize(json, json.Amd.GPU.length, "Amd")
      if (wattCommand !== '') {
        try {
          cp.execSync(wattCommand)
        } catch{}
      }
    }

    if (step !== "init" && step !== "stop") {
      if (json.Nvidia.GPU.length > 0) wattCommand = await checkCurrent(json, json.Nvidia.GPU.length, "Nvidia")
      if (wattCommand !== '') cp.execSync(wattCommand)

      if (json.Amd.GPU.length > 0) wattCommand = await checkCurrent(json, json.Amd.GPU.length, "Amd")
      if (wattCommand !== '') {
        try {
          cp.execSync(wattCommand)
        } catch {}
      }
    }

    return powerStatus
  })();

  async function initialize(json, gpuNumber, brand) {
    let maxPower = ocSettings[brand]["Powerlevel_%"]
    let initCommand = ''
    let nextWatt

    for (let i = 0; i < gpuNumber; i++) {
      if (brand == "Nvidia") {
        if (ocSettings[brand]["Use Hive_OC"]) {     
        let hiveOC = await ocHelper(json[brand]["GPU"][i].Name)
          // NVIDIA

          if (hiveOC !== 'no DB') {
            if (hiveOC.power_limit) initCommand += `sudo nvidia-smi -i ${i} -pl ${hiveOC.power_limit}; ` 
            powerStatus["Power"][brand][i] = hiveOC.power_limit
            nextWatt = hiveOC.power_limit
          } else {
            initCommand += defaultValues(json, maxPower, i, brand, initCommand)
          }          
        }
      } else {
        initCommand = defaultValues(json, maxPower, i, brand, initCommand)
      }
      if (nextWatt) powerStatus["Power"][brand][i] = nextWatt
    }
    return initCommand

    function defaultValues(json, maxPower, i, brand, initCommand = '') {
      if (brand == "Nvidia") {
        let minWatt = json[brand]["GPU"][i]["Min Watt"].split(' ')[0]
        let maxWatt = json[brand]["GPU"][i]["Max Watt"].split(' ')[0]
        nextWatt = Math.round(Number(minWatt) + (maxWatt - minWatt) / 50 * (maxPower - 50))
        initCommand += `sudo nvidia-smi -i ${i} -pl ${nextWatt}; `
      }

      if (brand == "Amd") {     
        try {
          cp.execSync('sudo ./helpers/ROC-smi/rocm-smi -d 0 --setpoweroverdrive 100000 --autorespond yes').toString()
        } catch(ex) {
          var maxPower = ex.stdout.toString()
          maxPower = maxPower.split('than')[1].split('.')[0].trim()
        }

        let minWatt = (maxPower / 2).toFixed(0)
        let maxWatt = maxPower
        nextWatt = Math.round(Number(minWatt) + (maxWatt - minWatt) / 50 * (maxPower - 50))
        initCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${i} --setpoweroverdrive ${nextWatt} --autorespond yes; `
        if (nextWatt) powerStatus["Power"][brand][i] = nextWatt
      }

      return initCommand
    }
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
          wattCommand += `sudo nvidia-smi -i ${i} -pl ${nextWatt}; `
        }

        if (brand == "Amd") {
          wattCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${i} --setpoweroverdrive ${nextWatt} --autorespond yes; `
        }
      }
      if (nextWatt) powerStatus["Power"][brand][i] = nextWatt
      else powerStatus["Power"][brand][i] = json[brand]["GPU"][i]["Watt"]
    }
  
    return wattCommand
  }
}