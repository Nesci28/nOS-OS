module.exports = async function(json, step, watchdogStatus) {
  // Dependancies
  const fs = require("fs");
  const cp = require("child_process");

  // Setup
  const maxTemp = require("../Overclocks.json");
  const systemConfig = require("../SystemConfig.json");

  // Exporting watchdog result
  if (!watchdogStatus) {
    watchdogStatus = {
      Watchdog: {
        Nvidia: {
          Utilization: [],
          Core: [],
          Mem: [],
          Temperature: [],
        },
        Amd: {
          Utilization: [],
          Core: [],
          Mem: [],
          Temperature: [],
        },
      },
    };
  }

  if (step == "init") {
    if (json.Nvidia.GPU.length > 0) {
      watchdogStatus["Watchdog"]["Nvidia"]["Utilization"].push("Initializing");
      watchdogStatus["Watchdog"]["Nvidia"]["Core"].push("Initializing");
      watchdogStatus["Watchdog"]["Nvidia"]["Mem"].push("Initializing");
      watchdogStatus["Watchdog"]["Nvidia"]["Temperature"].push("Initializing");
    }

    if (json.Amd.GPU.length > 0) {
      watchdogStatus["Watchdog"]["Amd"]["Utilization"].push("Initializing");
      watchdogStatus["Watchdog"]["Amd"]["Core"].push("Initializing");
      watchdogStatus["Watchdog"]["Amd"]["Mem"].push("Initializing");
      watchdogStatus["Watchdog"]["Amd"]["Temperature"].push("Initializing");
    }
  }

  if (step !== "init") {
    if (watchdogStatus["Watchdog"]["Nvidia"]["Utilization"] == "Initializing")
      watchdogStatus["Watchdog"]["Nvidia"]["Utilization"] = 0;
    if (watchdogStatus["Watchdog"]["Amd"]["Utilization"] == "Initializing")
      watchdogStatus["Watchdog"]["Amd"]["Utilization"] = 0;
    if (watchdogStatus["Watchdog"]["Nvidia"]["Core"] == "Initializing")
      watchdogStatus["Watchdog"]["Nvidia"]["Core"] = 0;
    if (watchdogStatus["Watchdog"]["Amd"]["Core"] == "Initializing")
      watchdogStatus["Watchdog"]["Amd"]["Core"] = 0;
    if (watchdogStatus["Watchdog"]["Nvidia"]["Mem"] == "Initializing")
      watchdogStatus["Watchdog"]["Nvidia"]["Mem"] = 0;
    if (watchdogStatus["Watchdog"]["Amd"]["Mem"] == "Initializing")
      watchdogStatus["Watchdog"]["Amd"]["Mem"] = 0;

    if (systemConfig["Watchdog Temp"]) {
      if (json.Runtime >= 1000 * 60 * 10) {
        await getTemp(json);
      } else {
        watchdogStatus["Watchdog"]["Nvidia"][
          "Temperature"
        ][0] = `Stabilizing temperature: ${(
          (1000 * 60 * 10 - json.Runtime) /
          1000 /
          60
        ).toFixed(2)} mins left`;
        watchdogStatus["Watchdog"]["Amd"][
          "Temperature"
        ][0] = `Stabilizing temperature: ${(
          (1000 * 60 * 10 - json.Runtime) /
          1000 /
          60
        ).toFixed(2)} mins left`;
      }
    } else {
      watchdogStatus["Watchdog"]["Nvidia"]["Temperature"][0] =
        "WatchDog Temperature: disabled";
      watchdogStatus["Watchdog"]["Amd"]["Temperature"][0] =
        "WatchDog Temperature: disabled";
    }
    if (systemConfig["Watchdog Mem"]) {
      await getMemClock(json);
    } else {
      watchdogStatus["Watchdog"]["Nvidia"]["Mem"][0] =
        "WatchDog Memory: disabled";
      watchdogStatus["Watchdog"]["Amd"]["Mem"][0] = "WatchDog Memory: disabled";
    }
    if (systemConfig["Watchdog Core"]) {
      await getCoreClock(json);
    } else {
      watchdogStatus["Watchdog"]["Nvidia"]["Core"][0] =
        "WatchDog Core: disabled";
      watchdogStatus["Watchdog"]["Amd"]["Core"][0] = "WatchDog Core: disabled";
    }
    if (systemConfig["Watchdog Util"]) {
      await getUtilization(json);
    } else {
      watchdogStatus["Watchdog"]["Nvidia"]["Utilization"][0] =
        "WatchDog Utilization: disabled";
      watchdogStatus["Watchdog"]["Amd"]["Utilization"][0] =
        "WatchDog Utilization: disabled";
    }
  }
  return watchdogStatus;

  async function getTemp(infos) {
    if (infos["Nvidia"]["GPU"].length > 0) await getGPUTemp(infos, "Nvidia");
    if (infos["Amd"]["GPU"].length > 0) await getGPUTemp(infos, "Amd");

    function getGPUTemp(infos, brand) {
      for (let i = 0; i < infos[brand]["GPU"].length; i++) {
        let gpuTemperature = infos[brand]["GPU"][i.toString()]["Temperature"];

        if (gpuTemperature <= maxTemp[brand]["Max Temperature"] + 3) {
          watchdogStatus["Watchdog"][brand]["Temperature"][i] = 0;
        } else if (
          gpuTemperature > maxTemp[brand]["Max Temperature"] + 3 &&
          gpuTemperature < maxTemp[brand]["Max Temperature"] + 10
        ) {
          watchdogStatus["Watchdog"][brand]["Temperature"][i] =
            watchdogStatus["Watchdog"][brand]["Temperature"][i] + 1 || 1;
        } else if (gpuTemperature >= maxTemp[brand]["Max Temperature"] + 10) {
          watchdogStatus["Watchdog"][brand]["Temperature"][i] =
            watchdogStatus["Watchdog"][brand]["Temperature"][i] + 2 || 2;
        }

        if (watchdogStatus["Watchdog"][brand]["Temperature"][i] == 10) {
          restart("maxTemp", i);
        }
      }
    }
  }

  async function getMemClock(infos) {
    if (infos["Nvidia"]["GPU"].length > 0)
      await getGPUMemClock(infos, "Nvidia");
    if (infos["Amd"]["GPU"].length > 0) await getGPUMemClock(infos, "Amd");

    function getGPUMemClock(infos, brand) {
      for (let i = 0; i < infos[brand]["GPU"].length; i++) {
        if (brand === "Nvidia") {
          var gpuMemClock = infos[brand]["GPU"][i.toString()][
            "Mem Clock"
          ].split(" ")[0];
          var gpuMemClockMax =
            infos[brand]["GPU"][i.toString()]["Max Mem"].split(" ")[0] - 300;
        }
        if (brand === "Amd") {
          var gpuMemClock = infos[brand]["GPU"][i.toString()]["Mem Clock"];
          var gpuMemClockMax = 1000;
        }

        if (gpuMemClock > gpuMemClockMax) {
          watchdogStatus["Watchdog"][brand]["Mem"][i] = 0;
        } else if (gpuMemClock <= gpuMemClockMax) {
          watchdogStatus["Watchdog"][brand]["Mem"][i] =
            watchdogStatus["Watchdog"][brand]["Mem"][i] + 1 || 1;
        }

        if (watchdogStatus["Watchdog"][brand]["Mem"][i] == 5) {
          restart("memClock", i);
        }
      }
    }
  }

  async function getCoreClock(infos) {
    if (infos["Nvidia"]["GPU"].length > 0)
      await getGPUCoreClock(infos, "Nvidia");
    if (infos["Amd"]["GPU"].length > 0) await getGPUCoreClock(infos, "Amd");

    function getGPUCoreClock(infos, brand) {
      for (let i = 0; i < infos[brand]["GPU"].length; i++) {
        if (brand === "Nvidia") {
          var gpuCoreClock = infos[brand]["GPU"][i.toString()][
            "Core Clock"
          ].split(" ")[0];
          var gpuCoreClockMax =
            infos[brand]["GPU"][i.toString()]["Max Core"].split(" ")[0] - 1000;
        }
        if (brand === "Amd") {
          var gpuCoreClock = infos[brand]["GPU"][i.toString()]["Core Clock"];
          var gpuCoreClockMax = 800;
        }

        if (gpuCoreClock > gpuCoreClockMax) {
          watchdogStatus["Watchdog"][brand]["Core"][i] = 0;
        } else if (gpuCoreClock <= gpuCoreClockMax) {
          watchdogStatus["Watchdog"][brand]["Core"][i] =
            watchdogStatus["Watchdog"][brand]["Core"][i] + 1 || 1;
        }

        if (watchdogStatus["Watchdog"][brand]["Core"][i] == 5) {
          restart("coreClock", i);
        }
      }
    }
  }

  async function getUtilization(infos) {
    if (infos["Nvidia"]["GPU"].length > 0)
      await getGPUUtilization(infos, "Nvidia");
    if (infos["Amd"]["GPU"].length > 0) await getGPUUtilization(infos, "Amd");

    function getGPUUtilization(infos, brand) {
      for (let i = 0; i < infos[brand]["GPU"].length; i++) {
        if (brand == "Nvidia")
          var gpuUtils = infos[brand]["GPU"][i.toString()]["Utilization"].split(
            " ",
          )[0];
        if (brand == "Amd")
          var gpuUtils = infos[brand]["GPU"][i.toString()][
            "Utilization"
          ].toString();

        if (gpuUtils >= 90) {
          watchdogStatus["Watchdog"][brand]["Utilization"][i] = 0;
        } else {
          watchdogStatus["Watchdog"][brand]["Utilization"][i] =
            watchdogStatus["Watchdog"][brand]["Utilization"][i] + 1 || 1;
        }

        if (watchdogStatus["Watchdog"][brand]["Utilization"][i] == 5) {
          restart("utils", i);
        }
      }
    }
  }

  function restart(reason, gpuPosition) {
    if (!fs.existsSync("../Logs")) {
      fs.mkdirSync("../Logs");
    }
    if (!fs.existsSync("../Logs/WatchDog.txt")) {
      fs.writeFileSync("../Logs/WatchDog.txt");
    }
    if (reason == "utils") {
      fs.writeFileSync(
        "../Logs/WatchDog.txt",
        new Date().getTime() +
          " - GPU : " +
          gpuPosition +
          " - Utilization is too low",
      );
    } else if (reason == "coreClock") {
      fs.writeFileSync(
        "../Logs/WatchDog.txt",
        new Date().getTime() +
          " - GPU : " +
          gpuPosition +
          " - Core Clock is too low",
      );
    } else if (reason == "memClock") {
      fs.writeFileSync(
        "../Logs/WatchDog.txt",
        new Date().getTime() +
          " - GPU : " +
          gpuPosition +
          " - Mem Clock is too low",
      );
    } else if (reason == "maxTemp") {
      fs.writeFileSync(
        "../Logs/WatchDog.txt",
        new Date().getTime() +
          " - GPU : " +
          gpuPosition +
          " - Temperature is too high",
      );
    }
    cp.execSync("sudo shutdown -r now");
  }
};
