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

  return (async () => {
    if (json.Nvidia.GPU.length > 0) {
      if (overclocksStatus["Overclocks"]["Nvidia"]["Core"] == null) overclocksStatus["Overclocks"]["Nvidia"]["Core"] = []
      if (overclocksStatus["Overclocks"]["Nvidia"]["Mem"] == null) overclocksStatus["Overclocks"]["Nvidia"]["Mem"] = []

      cp.execSync('sudo nvidia-xconfig -a --cool-bits 28');
      var ocCommand = ''

      if (step == "init") {
        for (let i = 0; i < json.Nvidia.GPU.length; i++) {
          if (ocSettings.Nvidia["Use Hive_OC"]) {
            let hiveOC = await ocHelper(json.Nvidia.GPU[i].Name)

            if (hiveOC && ocCommand == '') ocCommand += 'nvidia-settings '
            if (hiveOC.core_clock) {
              ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${hiveOC.core_clock}" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=${hiveOC.core_clock}" `
              overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = hiveOC.core_clock  
            }
            if (hiveOC.mem_clock) {
              ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${hiveOC.mem_clock}" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=${hiveOC.mem_clock}" `
              overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = hiveOC.mem_clock
            }
            if (!hiveOC.core_clock && !hiveOC.mem_clock) {
              localOC(ocSettings, ocCommand, i)
            }   
          } else {
            localOC(ocSettings, ocCommand, i)
          }
        }
      }

      if (step == "stop") {
        ocCommand += 'nvidia-settings '
        for (let i = 0; i < json.Nvidia.GPU.length; i++) {
          ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=0" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=0" `
          ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=0" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=0" `
          overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = "Resetted"
          overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = "Resetted"
        }
      }

      if (ocCommand) cp.execSync(`sudo ${ocCommand}`)
      return overclocksStatus
    }
  })();

  function localOC(ocSettings, ocCommand, i) {
    if (ocSettings.Nvidia.CoreClock && ocCommand == '' || ocSettings.Nvidia.MemClock && ocCommand == '') ocCommand += 'nvidia-settings '
    ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${ocSettings.Nvidia.CoreClock}" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=${ocSettings.Nvidia.CoreClock}" `
    overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = ocSettings.Nvidia.CoreClock 
    ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${ocSettings.Nvidia.MemClock}" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=${ocSettings.Nvidia.MemClock}" `
    overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = ocSettings.Nvidia.MemClock 

    return ocCommand
  }
}
