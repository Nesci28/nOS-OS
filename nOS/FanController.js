module.exports = async function(json, step) {
  // Dependancies
  const cp = require('child_process');

  // Setup
  const ocSettings = require('../Overclocks.json');

  // Exporting FanController result
  let temperatureStatus = {
    "Temperature": {
      "Nvidia": {
        "Current": [],
        "Fan Speed": []
      },
      "Amd": {
        "Current": [],
        "Fan Speed": []
      }
    }
  };

  let nvidiaGpuNumber = json.Nvidia.GPU.length
  let amdGpuNumber = json.Amd.GPU.length

  // Initializing on the first run
  if (nvidiaGpuNumber > 0 && step == "init") initialize(json, nvidiaGpuNumber, 'Nvidia')
  if (amdGpuNumber > 0 && step == "init") initialize(json, amdGpuNumber, 'Amd') 
  
  // Stop the fans
  if (nvidiaGpuNumber > 0 && step == "stop") stop(json, nvidiaGpuNumber, 'Nvidia')
  if (amdGpuNumber > 0 && step == "stop") stop(json, amdGpuNumber, 'Amd') 

  // Main Temperature Controller
  if (step !== "init" && step !== "stop") await main(json)
  return temperatureStatus


  function initialize(infos, gpuNumber, brand) {
    temperatureStatus["Temperature"][brand] = "Initializing" 
    let initCommand = ''
    let fanSpeed = 80;
    if (ocSettings[brand]["Max FanSpeed"] < 80) {
      fanSpeed = ocSettings[brand]["Max FanSpeed"];
    }
    for (let i = 0; i < gpuNumber; i++) {
      if (brand == "Nvidia") {
        initCommand += 'sudo nvidia-settings -a [gpu:' + i + ']/GPUFanControlState=1 -a [fan:' + i +']/GPUTargetFanSpeed=' + fanSpeed + '; '
      }
      if (brand == "Amd") {
        let amdGpuID = infos[brand]["GPU"][i]["ID"]
        initCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${amdGpuID} --setfan ${fanSpeed}%; `
      }
    }
    if (initCommand) cp.execSync(initCommand)
  }

  function stop(infos, gpuNumber, brand) {
    temperatureStatus["Temperature"][brand] = "Stopping" 
    let stopCommand = ''

    for (let i = 0; i < gpuNumber; i++) {
      if (brand == "Nvidia") {
        stopCommand += 'sudo nvidia-settings -a [gpu:' + i + ']/GPUFanControlState=1 -a [fan:' + i +']/GPUTargetFanSpeed=20 '
      }
      if (brand == "Amd") {
        let amdGpuID = infos[brand]["GPU"][i]["ID"]
        stopCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${amdGpuID} --setfan 20%; ` 
      }
    }
    if (stopCommand) cp.execSync(stopCommand)
  }

  async function main(infos) { 
    if (infos["Nvidia"]["GPU"].length > 0) {
      let fanCommand = await getGPUTemp(infos, "Nvidia")
      if (fanCommand) cp.execSync(fanCommand.trim())
    }
    if (infos["Amd"]["GPU"].length > 0) {
      let fanCommand = getGPUTemp(infos, "Amd")
      if (fanCommand) cp.execSync(fanCommand.trim())
    }

    function getGPUTemp(infos, brand) {
      let fanCommand = ''
      maxTemperature = ocSettings[brand]["Max Temperature"] + 3
      minTemperature = ocSettings[brand]["Max Temperature"] - 3
      maxFanSpeed = ocSettings[brand]["Max FanSpeed"]

      gpuDegree = []
      gpuTemperature = []

      for (let i = 0; i < infos[brand]["GPU"].length; i++) {
        if (brand == "Nvidia") currentFanSpeed = Number(infos[brand]["GPU"][i]["Fan Speed"].split(' ')[0])
        if (brand == "Amd") {
          currentFanSpeed = infos[brand]["GPU"][i]["Fan Speed"]
          var amdGpuID = infos[brand]["GPU"][i]["ID"]
        }
        if (currentFanSpeed >= ocSettings[brand]["Max FanSpeed"]) {
          gpuTemperature[i] = `${currentFanSpeed} Max`;
        } else {
          gpuTemperature[i] = currentFanSpeed;
        }
        if (infos[brand]["GPU"][i.toString()]["Temperature"] < minTemperature) {
          if (currentFanSpeed >= 21) { 
            if (brand == "Nvidia") {
              fanCommand += `sudo nvidia-settings -a [fan:${i}]/GPUTargetFanSpeed=${currentFanSpeed - 5} `
              gpuTemperature[i] = currentFanSpeed - 5
            }
            if (brand == "Amd") {
              fanCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${amdGpuID} --setfan ${currentFanSpeed - 5}%; `
              gpuTemperature[i] = currentFanSpeed - 5
            }
          }
        } else if (infos[brand]["GPU"][i.toString()]["Temperature"] > maxTemperature) {
          if (brand == "Nvidia") {
            if (currentFanSpeed <= maxFanSpeed - 5) {
              fanCommand += `sudo nvidia-settings -a [fan:${i}]/GPUTargetFanSpeed=${currentFanSpeed + 8} `
              gpuTemperature[i] = currentFanSpeed + 5
            } else {
              fanCommand += `-a [fan:${i}]/GPUTargetFanSpeed=${maxFanSpeed} `
              gpuTemperature[i] = maxFanSpeed + " Max"
            }
          }

          if (brand == "Amd") {
            if (currentFanSpeed <= maxFanSpeed - 5) {
              fanCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${amdGpuID} --setfan ${currentFanSpeed + 8}%; `
              gpuTemperature[i] = currentFanSpeed + 5
            } else {
              fanCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${amdGpuID} --setfan ${maxFanSpeed + 2}%; `
              gpuTemperature[i] = maxFanSpeed + " Max"
            }     
          }

        } else {
          if (currentFanSpeed == maxFanSpeed) currentFanSpeed = currentFanSpeed + " Max"
          gpuTemperature[i] = currentFanSpeed
        }
        gpuDegree[i] = Number(infos[brand]["GPU"][i.toString()]["Temperature"])
      }
      temperatureStatus["Temperature"][brand]["Current"] = gpuDegree
      temperatureStatus["Temperature"][brand]["Fan Speed"] = gpuTemperature

      return fanCommand
    }
  }
}
