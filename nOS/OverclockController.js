module.exports = async function(json, step, overclockStatus = "") {
  // Dependancies
  const cp = require("child_process");
  const fs = require("fs");

  // Setup
  const ocHelper = require("./helpers/HiveOS_API.js");
  const ocSettings = require("../Overclocks.json");

  if (overclockStatus == "") {
    overclocksStatus = {
      Overclocks: {
        Nvidia: {
          Core: null,
          Mem: null
        },
        Amd: {
          Mem: null,
          REF: null
        }
      }
    };
  }
  return (async () => {
    if (step !== "rxboost") {
      if (json.Nvidia.GPU.length > 0) {
        if (overclocksStatus["Overclocks"]["Nvidia"]["Core"] == null)
          overclocksStatus["Overclocks"]["Nvidia"]["Core"] = [];
        if (overclocksStatus["Overclocks"]["Nvidia"]["Mem"] == null)
          overclocksStatus["Overclocks"]["Nvidia"]["Mem"] = [];
        var ocCommand = "";

        if (step == "init") {
          for (let i = 0; i < json.Nvidia.GPU.length; i++) {
            if (ocSettings.Nvidia["Use Hive_OC"]) {
              let hiveOC = await ocHelper(json.Nvidia.GPU[i].Name, "OC");

              if (hiveOC && ocCommand == "") ocCommand += "nvidia-settings ";
              if (hiveOC.core_clock) {
                ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${
                  hiveOC.core_clock
                }" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=${
                  hiveOC.core_clock
                }" `;
                overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] =
                  hiveOC.core_clock;
              }
              if (hiveOC.mem_clock) {
                ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${
                  hiveOC.mem_clock
                }" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=${
                  hiveOC.mem_clock
                }" `;
                overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] =
                  hiveOC.mem_clock;
              }
              if (!hiveOC.core_clock && !hiveOC.mem_clock) {
                localOC(ocSettings, ocCommand, i);
              }
            } else {
              localOC(ocSettings, ocCommand, i);
            }
          }
        }

        if (step == "stop") {
          ocCommand += "nvidia-settings ";
          for (let i = 0; i < json.Nvidia.GPU.length; i++) {
            ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=0" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=0" `;
            ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=0" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=0" `;
            overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = "Resetted";
            overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = "Resetted";
          }
        }

        if (ocCommand) cp.execSync(`sudo ${ocCommand}`);
      }
    }

    if (json.Amd.GPU.length > 0) {
      if (overclocksStatus["Overclocks"]["Amd"]["Mem"] == null)
        overclocksStatus["Overclocks"]["Amd"]["Mem"] = ["Initializing"];
      if (overclocksStatus["Overclocks"]["Amd"]["REF"] == null)
        overclocksStatus["Overclocks"]["Amd"]["REF"] = ["Initializing"];

      var amdCommand = "";

      if (step == "rxboost") {
        for (let i = 0; i < json.Amd.GPU.length; i++) {
          amdCommand = "~/nOS/helpers/ROC-smi/rocm-smi ";
          amdCommand += `-d ${i} `;
          amdCommand += `--setperflevel manual `;
          cp.execSync(`sudo ${amdCommand}`);
        }

        for (let i = 0; i < json.Amd.GPU.length; i++) {
          overclocksStatus["Overclocks"]["Amd"]["Mem"][i] =
            ocSettings.Amd.Mem_overdrive;
          amdCommand = "~/nOS/helpers/ROC-smi/rocm-smi ";
          amdCommand += `-d ${i} `;
          amdCommand += `--setmemoverdrive ${ocSettings.Amd.Mem_overdrive} `;
          amdCommand += "--autorespond Y";
          cp.execSync(`sudo ${amdCommand}`);
        }

        amdCommand = "~/nOS/helpers/amdmemtweak ";
        for (let i = 0; i < json.Amd.GPU.length; i++) {
          overclocksStatus["Overclocks"]["Amd"]["REF"][i] =
            ocSettings.Amd.Rxboost;
          if (i == 0) amdCommand += `--i ${i},`;
          if (i < json.Amd.GPU.length - 1) {
            amdCommand += `${i},`;
          } else {
            amdCommand += `${i} `;
          }
        }
        amdCommand += `--REF ${ocSettings.Amd.Rxboost}`;
        cp.execSync(`sudo ${amdCommand}`);
      }

      if (step == "stop") {
        amdCommand += "~/nOS/helpers/ROC-smi/rocm-smi --resetclocks";
        cp.execSync(`sudo ${amdCommand}`);
      }
    }
    return overclocksStatus;
  })();

  function localOC(ocSettings, ocCommand, i) {
    if (
      (ocSettings.Nvidia.CoreClock && ocCommand == "") ||
      (ocSettings.Nvidia.MemClock && ocCommand == "")
    )
      ocCommand += "nvidia-settings ";
    ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${
      ocSettings.Nvidia.CoreClock
    }" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=${
      ocSettings.Nvidia.CoreClock
    }" `;
    overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] =
      ocSettings.Nvidia.CoreClock;
    ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${
      ocSettings.Nvidia.MemClock
    }" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=${
      ocSettings.Nvidia.MemClock
    }" `;
    overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] =
      ocSettings.Nvidia.MemClock;

    return ocCommand;
  }
};
