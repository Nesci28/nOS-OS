module.exports = async function(json, step, powerStatus = "") {
  // Dependancies
  const cp = require("child_process");

  // Setup
  const ocHelper = require("./helpers/HiveOS_API.js");
  const ocSettings = require("../Overclocks.json");

  if (powerStatus == "") {
    powerStatus = {
      Power: {
        Nvidia: [],
        Amd: [],
      },
    };
  }

  return (async () => {
    let wattCommand = "";
    if (step == "init") {
      if (json.Nvidia.GPU.length > 0)
        wattCommand = await initialize(json, json.Nvidia.GPU.length, "Nvidia");
      if (wattCommand !== "") cp.execSync(wattCommand);

      if (json.Amd.GPU.length > 0)
        wattCommand = await initialize(json, json.Amd.GPU.length, "Amd");
      if (wattCommand !== "") {
        try {
          cp.execSync(wattCommand);
        } catch {}
      }
    }

    if (step !== "init" && step !== "stop") {
      if (json.Nvidia.GPU.length > 0)
        wattCommand = await checkCurrent(
          json,
          json.Nvidia.GPU.length,
          "Nvidia",
        );
      if (wattCommand !== "") cp.execSync(wattCommand);

      if (json.Amd.GPU.length > 0)
        wattCommand = await checkCurrent(json, json.Amd.GPU.length, "Amd");
      if (wattCommand !== "") {
        try {
          cp.execSync(wattCommand);
        } catch {}
      }
    }

    return powerStatus;
  })();

  async function initialize(json, gpuNumber, brand) {
    let maxPower = ocSettings[brand]["Powerlevel_%"];
    let initCommand = "";
    let nextWatt;

    for (let i = 0; i < gpuNumber; i++) {
      if (brand == "Nvidia") {
        if (ocSettings[brand]["Use Hive_OC"]) {
          let hiveOC = await ocHelper(json[brand]["GPU"][i].Name, "OC");
          if (hiveOC !== "no DB") {
            if (hiveOC.power_limit)
              initCommand += `sudo nvidia-smi -i ${i} -pl ${hiveOC.power_limit}; `;
            powerStatus["Power"][brand][i] = hiveOC.power_limit;
            nextWatt = hiveOC.power_limit;
          } else {
            initCommand += defaultValues(json, maxPower, i, brand, initCommand);
          }
        } else {
          initCommand = defaultValues(json, maxPower, i, brand, initCommand);
        }
      } else if (brand == "Amd") {
        initCommand = defaultValues(json, maxPower, i, brand, initCommand);
      }
      if (nextWatt) powerStatus["Power"][brand][i] = nextWatt;
    }
    return initCommand;

    function defaultValues(json, maxPower, i, brand, initCommand = "") {
      if (brand == "Nvidia") {
        let minWatt = json[brand]["GPU"][i]["Min Watt"].split(" ")[0];
        let maxWatt = json[brand]["GPU"][i]["Max Watt"].split(" ")[0];
        nextWatt = Math.round(
          Number(minWatt) + ((maxWatt - minWatt) / 50) * (maxPower - 50),
        );
        initCommand += `sudo nvidia-smi -i ${i} -pl ${nextWatt}; `;
      }

      if (brand == "Amd") {
        let amdGpuID = json[brand]["GPU"][i]["ID"];
        let minWatt = json[brand]["GPU"][i]["Min Watt"];
        let maxWatt = json[brand]["GPU"][i]["Max Watt"];

        nextWatt = Math.round(
          Number(minWatt) + ((maxWatt - minWatt) / 50) * (maxPower - 50),
        );
        initCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${amdGpuID} --setpoweroverdrive ${nextWatt} --autorespond yes; `;
      }
      if (nextWatt) powerStatus["Power"][brand][i] = nextWatt;

      return initCommand;
    }
  }

  function checkCurrent(json, gpuNumber, brand) {
    let ocSettingMaxTemp = ocSettings[brand]["Max Temperature"] + 3;
    const ocSettingMaxFan = ocSettings[brand]["Max FanSpeed"];
    let wattCommand = "";

    for (var i = 0; i < gpuNumber; i++) {
      let nextWatt;
      let amdGpuID;
      let currentTemp = json[brand]["GPU"][i]["Temperature"];

      currentFanSpeed = parseInt(
        json[brand]["GPU"][i]["Fan Speed"].toString().replace(/\D/g, ""),
      );
      minWatt = parseInt(
        json[brand]["GPU"][i]["Min Watt"].toString().replace(/ W/g, ""),
      );

      if (
        currentFanSpeed >= ocSettingMaxFan &&
        currentTemp > ocSettingMaxTemp
      ) {
        if (brand == "Nvidia") {
          nextWatt = json[brand]["GPU"][i]["Watt"].split(".")[0] - 5;
          if (nextWatt >= minWatt) {
            console.log(`Adjusting Wattage on ${brand}-${i} to ${nextWatt}`);
            wattCommand += `sudo nvidia-smi -i ${i} -pl ${nextWatt}; `;
          }
        }
        if (brand == "Amd") {
          nextWatt = Math.round(json[brand]["GPU"][i]["Watt"]) - 5;
          if (nextWatt >= minWatt) {
            amdGpuID = json[brand]["GPU"][i]["ID"];
            console.log(
              `Adjusting Wattage on ${brand}-${amdGpuID} to ${nextWatt}`,
            );
            wattCommand += `sudo ./helpers/ROC-smi/rocm-smi -d ${amdGpuID} --setpoweroverdrive ${nextWatt} --autorespond yes; `;
          }
        }
      }

      if (nextWatt) powerStatus["Power"][brand][i] = nextWatt;
      // else powerStatus["Power"][brand][i] = parseInt(json[brand]["GPU"][i]["Watt"].replace(/W /, ''))
    }

    return wattCommand;
  }
};
