module.exports = async function(json, step) {
  // Dependancies
  const cp = require('child_process');

  // Setup
  const ocSettings = require('../Overclocks.json');

  // Exporting watchdog result
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
  if (nvidiaGpuNumber > 0 && step == "init") initialize(nvidiaGpuNumber, 'Nvidia')
  if (amdGpuNumber > 0 && step == "init") initialize(amdGpuNumber, 'Amd') 
  
  // Stop the fans
  if (nvidiaGpuNumber > 0 && step == "stop") stop(nvidiaGpuNumber, 'Nvidia')
  if (amdGpuNumber > 0 && step == "stop") stop(amdGpuNumber, 'Amd') 

  // Main Temperature Controller
  if (step !== "init" && step !== "stop") await main(json)
  return temperatureStatus


  function initialize(gpuNumber, brand) {
    temperatureStatus["Temperature"][brand] = "Initializing" 
    let initCommand = ''

    for (let i = 0; i < gpuNumber; i++) {
      if (brand == "Nvidia") {
        if (i == 0) initCommand += 'nvidia-settings '
        initCommand += '-a [gpu:' + i + ']/GPUFanControlState=1 -a [fan:' + i +']/GPUTargetFanSpeed=80 '
      }
      if (brand == "Amd") {
        initCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${i} --setfan ${amdFanSpeedConvertTo(80)}; `
      }
    }
    if (initCommand) cp.execSync(initCommand)
  }

  function stop(gpuNumber, brand) {
    temperatureStatus["Temperature"][brand] = "Stopping" 
    let stopCommand = ''

    for (let i = 0; i < gpuNumber; i++) {
      if (brand == "Nvidia") {
        if (i == 0) stopCommand += 'nvidia-settings '
        stopCommand += '-a [gpu:' + i + ']/GPUFanControlState=1 -a [fan:' + i +']/GPUTargetFanSpeed=20 '
      }
      if (brand == "Amd") {
        stopCommand += `./helpers/ROC-smi/rocm-smi -d ${i} --setfan ${amdFanSpeedConvertTo(20)}; ` 
      }
    }
    if (stopCommand) cp.execSync(stopCommand)
  }

  async function main(infos) { 
    if (infos["Nvidia"]["GPU"].length > 0) {
      let fanCommand = await getGPUTemp(infos, "Nvidia")
      if (fanCommand) cp.execSync('sudo ' + fanCommand.trim())
    }
    if (infos["Amd"]["GPU"].length > 0) {
      let fanCommand = getGPUTemp(infos, "Amd")
      if (fanCommand) cp.execSync('sudo ' + fanCommand.trim())
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
        if (brand == "Amd") currentFanSpeed = Number(infos[brand]["GPU"][i]["Fan Speed"].toString().split('.')[0])
        
        if (infos[brand]["GPU"][i.toString()]["Temperature"] < minTemperature) {
          if (currentFanSpeed >= 21) { 
            if (brand == "Nvidia") {
              if (fanCommand == '') fanCommand += 'nvidia-settings '
              fanCommand += `-a [fan:${i}]/GPUTargetFanSpeed=${currentFanSpeed - 5} `
              gpuTemperature[i] = currentFanSpeed - 5
            }
            if (brand == "Amd") {
              fanCommand += `./helpers/ROC-smi/rocm-smi -d ${i} --setfan ${amdFanSpeedConvertTo(currentFanSpeed - 5)}; `
              gpuTemperature[i] = amdFanSpeedConvertFrom(currentFanSpeed - 5)
            }
          }
        } else if (infos[brand]["GPU"][i.toString()]["Temperature"] > maxTemperature) {
          if (currentFanSpeed <= maxFanSpeed - 5) {
            if (i == 0 && brand == "Nvidia") fanCommand += 'nvidia-settings '
            if (brand == "Nvidia") {
              fanCommand += `-a [fan:${i}]/GPUTargetFanSpeed=${currentFanSpeed + 5} `
              gpuTemperature[i] = currentFanSpeed + 5
            }
            if (i == 0 && brand == "Amd") fanCommand += 'rocm-smi '
            if (brand == "Amd") {
              fanCommand += `./helpers/ROC-smi/rocm-smi -d ${i} --setfan ${amdFanSpeedConvertTo(currentFanSpeed + 5)}; `
              gpuTemperature[i] = amdFanSpeedConvertFrom(currentFanSpeed + 5)
            }
          }
        } else {
          gpuTemperature[i] = currentFanSpeed
        }
        gpuDegree[i] = Number(infos[brand]["GPU"][i.toString()]["Temperature"])
      }
      temperatureStatus["Temperature"][brand]["Current"] = gpuDegree
      temperatureStatus["Temperature"][brand]["Fan Speed"] = gpuTemperature

      return fanCommand
    }
  }

  function amdFanSpeedConvertTo(speed) {
    return Math.round(speed * 255 / 100)
  }
  function amdFanSpeedConvertFrom(speed) {
    return Math.round(speed * 100 / 255)
  }
}
