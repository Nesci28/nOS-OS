module.exports = async function(json, step) {
  // Dependancies
  const cp = require('child_process');

  // Setup
  const maxTemp = require('../Overclocks.json');

  // Exporting watchdog result
  let temperatureStatus = {
    "Temperature": {
      "Nvidia": null,
      "Amd": null
    }
  };

  let nvidiaGpuNumber = json.Nvidia.GPU.length
  let amdGpuNumber = json.Amd.GPU.length

  // Initializing on the first run
  if (nvidiaGpuNumber > 0 && step == "init") initialize(nvidiaGpuNumber, 'Nvidia')
  if (amdGpuNumber > 0 && step == "init") initialize(nvidiaGpuNumber, 'Amd') 
  
  // Stop the fans
  if (nvidiaGpuNumber > 0 && step == "stop") stop(nvidiaGpuNumber, 'Nvidia')
  if (amdGpuNumber > 0 && step == "stop") stop(nvidiaGpuNumber, 'Amd') 

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
        if (i == 0) initCommand += 'rocm-smi '
        initCommand += '-d ' + i + ' --setfan ' + amdFanSpeedConvertTo(80) + ' '
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
        if (i == 0) stopCommand += 'rocm-smi '
        stopCommand += '-d ' + i + ' --setfan ' + amdFanSpeedConvertTo(20) + ' '
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
      maxTemperature = maxTemp[brand]["Max Temperature"] + 3
      minTemperature = maxTemp[brand]["Max Temperature"] - 3
      gpuTemperature = []

      for (let i = 0; i < infos[brand]["GPU"].length; i++) {
        currentFanSpeed = Number(infos[brand]["GPU"][i.toString()]["Fan Speed"].split(' ')[0])
        
        if (infos[brand]["GPU"][i.toString()]["Temperature"] < minTemperature) {
          if (i == 0 && brand == "Nvidia") fanCommand += 'nvidia-settings '
          if (brand == "Nvidia") {
            fanCommand += `-a [fan:${i}]/GPUTargetFanSpeed=${currentFanSpeed - 5} `
            gpuTemperature.push(currentFanSpeed - 5)
          }
        
          if (i == 0 && brand == "Amd") fanCommand += 'rocm-smi '
          if (brand == "Amd") {
            fanCommand += `-d +{i} --setfan ${amdFanSpeedConvertTo(currentFanSpeed - 5)} `
            gpuTemperature.push(amdFanSpeedConvertFrom(currentFanSpeed - 5))
          }

        } else if (infos[brand]["GPU"][i.toString()]["Temperature"] > maxTemperature) {
          if (i == 0 && brand == "Nvidia") fanCommand += 'nvidia-settings '
          if (brand == "Nvidia") {
            fanCommand += `-a [fan:${i}]/GPUTargetFanSpeed=${currentFanSpeed + 5} `
            gpuTemperature.push(currentFanSpeed + 5)
          }
          if (i == 0 && brand == "Amd") fanCommand += 'rocm-smi '
          if (brand == "Amd") {
            fanCommand += `-d +{i} --setfan ${amdFanSpeedConvertTo(currentFanSpeed + 5)} `
            gpuTemperature.push(amdFanSpeedConvertFrom(currentFanSpeed + 5))
          }
        }
      }
      temperatureStatus["Temperature"][brand] = gpuTemperature
      return fanCommand
    }
  }

  function amdFanSpeedConvertTo(speed) {
    return speed * 255 / 100
  }
  function amdFanSpeedConvertFrom(speed) {
    return speed * 100 / 255
  }
}
