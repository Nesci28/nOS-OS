module.exports = async function(json, step) {
  // Dependancies
  const cp = require('child_process');

  // Setup
  const ocHelper = require('./helpers/HiveOverclocksAPI.js');
  const ocSettings = require('../Overclocks.json');

  let overclocksStatus = {
    "Overclocks": {
      "Nvidia": {
        "Core": null,
        "Mem": null
      },
      "Amd": {
        "Core": null,
        "Mem": null
      }
    }
  };

  if (json.Nvidia.GPU.length > 0) {
    cp.execSync('sudo nvidia-xconfig -a --cool-bits 28');
    var ocCommand = ''

    if (step == "init") {
      for (let i = 0; i < json.Nvidia.GPU.length; i++) {
        if (ocSettings.Nvidia["Use Hive_OC"]) {
          let hiveOC = await ocHelper(json.Nvidia.GPU[i].Name)

          if (hiveOC && ocCommand == '') ocCommand += 'nvidia-settings '
          if (hiveOC.core_clock) {
            ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${hiveOC.core_clock}" `
            if (overclocksStatus["Overclocks"]["Nvidia"]["Core"] == null) overclocksStatus["Overclocks"]["Nvidia"]["Core"] = []
            overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = hiveOC.core_clock  
          }
          if (hiveOC.mem_clock) {
            ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${hiveOC.mem_clock}" `
            if (overclocksStatus["Overclocks"]["Nvidia"]["Mem"] == null) overclocksStatus["Overclocks"]["Nvidia"]["Mem"] = []
            overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = hiveOC.mem_clock
          }        
        } else {
          if (ocSettings.Nvidia.CoreClock && ocCommand == '' || ocSettings.Nvidia.MemClock && ocCommand == '') ocCommand += 'nvidia-settings '
          ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${ocSettings.Nvidia.CoreClock}" `
          ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${ocSettings.Nvidia.MemClock}" `
          overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = ocSettings.Nvidia.CoreClock 
          overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = ocSettings.Nvidia.MemClock 
        }
      }
    }

    if (step == "stop") {
      ocCommand += 'nvidia-settings '
      for (let i = 0; i < json.Nvidia.GPU.length; i++) {
        ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=0" `
        ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=0" `
        if (overclocksStatus["Overclocks"]["Nvidia"]["Core"] == null) overclocksStatus["Overclocks"]["Nvidia"]["Core"] = []
        if (overclocksStatus["Overclocks"]["Nvidia"]["Mem"] == null) overclocksStatus["Overclocks"]["Nvidia"]["Mem"] = []
        overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = "Resetted"
        overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = "Resetted"
      }
    }

    if (ocCommand) cp.execSync(`sudo ${ocCommand}`)
    return overclocksStatus
  }
}