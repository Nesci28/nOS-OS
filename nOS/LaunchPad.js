// Dependancies
const fs = require("fs");
const cp = require("child_process");
const axios = require("axios");
// const util = require("util");
const md5File = require("md5-file");
const wifi = require("node-wifi");
const cloneDeep = require("clone-deep");
const prettyjson = require("prettyjson");
const prettyjsonOptions = {
  keysColor: "white",
  dashColor: "magenta",
  stringColor: "green",
  numberColor: "yellow",
};

// Requirements
const git = require("./git.js");
let info = require("./getInfo.js");
let powerControl = require("./PowerController.js");
let ocControl = require("./OverclockController.js");
let tempControl = require("./FanController.js");
let coins = require("./Coins.js");
let watchdog = require("./WatchDog.js");
let shellinabox = require("./shellinabox.js");
const DB = require("./DB.js");
// const showUI = require('./UI.js');
let systemConfig = require("../SystemConfig.json");

if (process.argv[process.argv.length - 1] == "stop") {
  (async () => {
    await stop();
    process.stdout.write("\033c");
    process.exit();
  })();
}

if (process.argv[process.argv.length - 1] == "init") {
  (async () => {
    if (systemConfig["Wifi Name"] && systemConfig["Wifi Password"]) {
      await connection(
        systemConfig["Wifi Name"],
        systemConfig["Wifi Password"],
      );
      cp.exec(
        `nmcli con modify $(nmcli c | grep wifi | cut -d' ' -f1) connection.permissions ''`,
      );
    }
    await git();
    await checkXorg();
    await moveConfig();
    await screenBlanking();
    await clearDB();
    let counter = 0;
    await launchPad("init", counter);
  })();
}

async function launchPad(
  step,
  counter,
  coin,
  power,
  overclocks,
  temperature,
  watch,
  database = "",
  json = "",
  shell = "",
) {
  if (step !== "shellinabox") {
    if (step == "init") {
      process.stdout.write("\033c");
    }
    if (step !== "init") {
      console.log("Updating the values...");
    }
    if (step == "init") {
      console.log("[1/9] Fetching the rig info / Checking for update");
    } else if (counter == 5 || counter % 2 == 0) {
      console.log("[1/5] Fetching the new rig info");
    } else {
      console.log("[1/4] Fetching the new rig info");
    }
    json = await info(step, json, counter);
  }

  if (step == "init") {
    try {
      cp.execSync("sudo timedatectl set-ntp true");
    } catch {}
    console.log("[2/9] Shellinabox");
    shell = await shellinabox(step);
    json.Shellinabox = shell;
    console.log("[3/9] Configuring the GPU(s) Power");
    power = await powerControl(json, step);
    console.log("[4/9] Configuring the GPU(s) Overclocks");
    overclocks = await ocControl(json, step);
    console.log("[5/9] Configuring the GPU(s) Temperature");
    temperature = await tempControl(json, step);
    console.log("[6/9] Launching the miner(s)");
    coin = await coins(json);
    console.log("[7/9] Setting up tmux");
    cp.exec("./tmux.sh && exit &");
    console.log("[8/9] Sending the newest values to the WebUI");
    try {
      database = await DB(json, "");
    } catch {}
    console.log("[9/9] Starting Watchdog");
    watch = await watchdog(json, step);
  }

  if (counter == 5) {
    console.log("[2/5] Configuring the GPU(s) Overclocks (second pass)");
    overclocks = await ocControl(json, "rxboost", overclocks);
  }

  if (step == "running") {
    if (counter == 5) {
      console.log("[3/5] Configuring the GPU(s) Temperature");
    } else if (counter % 2 == 0) {
      console.log("[2/5] Configuring the GPU(s) Temperature");
    } else {
      console.log("[2/4] Configuring the GPU(s) Temperature");
    }
    temperature = await tempControl(json, step);
    if (counter == 5) {
      console.log("[4/5] Checking Watchdog");
    } else if (counter % 2 == 0) {
      console.log("[3/5] Checking Watchdog");
    } else {
      console.log("[3/4] Checking Watchdog");
    }
    watch = await watchdog(json, step, watch);
  }

  if (counter == 60) {
    counter = 0;
    try {
      cp.execSync("sudo timedatectl set-ntp true");
    } catch {}
    console.log("[5/5] Shellinabox");
    shell = await shellinabox("reset", shell);
    json.Shellinabox = shell;
  }

  if (step == "running") {
    if (counter % 2 == 0) {
      console.log("[4/5] Checking if the GPU(s) Power need(s) to be adjusted");
      power = await powerControl(json, step, power);
    }
    var existingDB = database.DB.Entry;
    if (counter == 5 || counter % 2 == 0) {
      console.log("[5/5] Sending the newest values to the WebUI");
    } else {
      console.log("[4/4] Sending the newest values to the WebUI");
    }
    try {
      database = await DB(json, existingDB);
    } catch {}
  }

  process.stdout.write("\033c");
  if (json.Nvidia.GPU.length > 0 && json.Amd.GPU.length > 0) {
    console.log(prettyjson.render(coin, prettyjsonOptions));
    console.log(prettyjson.render(power, prettyjsonOptions));
    if (overclocks !== undefined) {
      console.log(prettyjson.render(overclocks, prettyjsonOptions));
    }
    console.log(prettyjson.render(temperature, prettyjsonOptions));
    console.log(prettyjson.render(watch, prettyjsonOptions));
  }

  if (json.Nvidia.GPU.length > 0 && json.Amd.GPU.length == 0) {
    let coinNvidia = cloneDeep(coin);
    delete coinNvidia.Coins.Amd;
    console.log(prettyjson.render(coinNvidia, prettyjsonOptions));

    let powerNvidia = cloneDeep(power);
    delete powerNvidia.Power.Amd;
    console.log(prettyjson.render(powerNvidia, prettyjsonOptions));

    if (overclocks !== undefined) {
      let overclocksNvidia = cloneDeep(overclocks);
      delete overclocksNvidia.Overclocks.Amd;
      console.log(prettyjson.render(overclocksNvidia, prettyjsonOptions));
    }

    let temperatureNvidia = cloneDeep(temperature);
    delete temperatureNvidia.Temperature.Amd;
    console.log(prettyjson.render(temperatureNvidia, prettyjsonOptions));

    let watchdogNvidia = cloneDeep(watch);
    delete watchdogNvidia.Watchdog.Amd;
    console.log(prettyjson.render(watchdogNvidia, prettyjsonOptions));
  }

  if (json.Nvidia.GPU.length == 0 && json.Amd.GPU.length > 0) {
    let coinAmd = cloneDeep(coin);
    delete coinAmd.Coins.Nvidia;
    console.log(prettyjson.render(coinAmd, prettyjsonOptions));

    let powerAmd = cloneDeep(power);
    delete powerAmd.Power.Nvidia;
    console.log(prettyjson.render(powerAmd, prettyjsonOptions));

    if (overclocks !== undefined) {
      let overclocksAmd = cloneDeep(overclocks);
      delete overclocksAmd.Overclocks.Nvidia;
      console.log(prettyjson.render(overclocksAmd, prettyjsonOptions));
    }

    let temperatureAmd = cloneDeep(temperature);
    delete temperatureAmd.Temperature.Nvidia;
    console.log(prettyjson.render(temperatureAmd, prettyjsonOptions));

    let watchdogAmd = cloneDeep(watch);
    delete watchdogAmd.Watchdog.Nvidia;
    console.log(prettyjson.render(watchdogAmd, prettyjsonOptions));
  }

  console.log(prettyjson.render(shell, prettyjsonOptions));
  console.log("\n");
  console.log("Tunnel reset Counter: " + counter + "/60");

  setTimeout(async () => {
    counter++;
    await launchPad(
      "running",
      counter,
      coin,
      power,
      overclocks,
      temperature,
      watch,
      database,
      json,
      shell,
    );
  }, 15000);
}

if (process.argv[process.argv.length - 2] == "gpu") {
  (async () => {
    let json = await info("init");
    if (process.argv[process.argv.length - 1] == "nvidia")
      console.log(json.Nvidia.GPU);
    if (process.argv[process.argv.length - 1] == "amd")
      console.log(json.Amd.GPU);
    process.exit();
  })();
}

async function stop() {
  let json = await info("stop");

  let overclocks = await ocControl(json, "stop");
  console.log(prettyjson.render(overclocks, prettyjsonOptions));

  let temperature = await tempControl(json, "stop");
  console.log(prettyjson.render(temperature, prettyjsonOptions));

  let shell = await shellinabox("stop");
  console.log(prettyjson.render(shell, prettyjsonOptions));

  cp.execSync("pm2 kill 2>&1 >/dev/null");
  cp.execSync("rm -rf ~/.pm2/logs/*");
  cp.execSync("pm2 flush");

  const pm2Processes = [
    "LaunchPad",
    "minerNvidia",
    "minerAmd",
    "minerCpu",
    "ethpill",
  ];
  for (let PIDS of pm2Processes) {
    let pm2List = cp.execSync(
      `ps aux | grep pm2 | grep ${PIDS} | grep "node" | sed 's/  */ /g' | cut -d ' ' -f2`,
    );
    pm2List = pm2List
      .toString()
      .trim()
      .split("\n");
    for (let ID of pm2List) {
      try {
        cp.execSync(`kill ${ID} 2>&1 >/dev/null`);
      } catch {}
    }
  }

  try {
    cp.execSync("tmux kill-session -t miner 2>&1 >/dev/null");
  } catch {}
}

function screenBlanking() {
  cp.execSync("xset -dpms; xset s off;");
}

async function connection(ssid, password) {
  await require("dns").resolve("www.google.com", async function(err) {
    if (err) {
      console.log("No connection, connecting...");
      await wifi.init({
        iface: null,
      });
      await wifi.connect({ ssid: ssid, password: password }, function(err) {
        if (err) {
          console.log(err);
        }
        return "Connected";
      });
    } else {
      return "Connected";
    }
  });
}

async function clearDB() {
  const urlGet = "https://nos-server.now.sh/db";
  const urlPost = "https://nos-server.now.sh/rig/add";
  const urlPostAlternative = "https://node-nos.herokuapp.com/api/v2/rig/add";
  const emptyJson = {
    _id: null,
    "New Time": new Date().getTime(),
    "Old Time": null,
    "Runtime Start": new Date().getTime(),
    Runtime: null,
    Username: systemConfig["WebApp Username"],
    Password: systemConfig["WebApp Password"],
    Hostname: systemConfig["Rig Hostname"],
    IP: null,
    Shellinabox: {
      Localtunnel: { url: null },
      Serveo: { url: null },
    },
    "Local GitHash": null,
    "Remote GitHash": null,
    "External Command": null,
    Nvidia: {
      Coin: null,
      Algo: null,
      "Total Hashrate": null,
      "Total Watt": null,
      "Avg Temperature": null,
      "Coin Info": {},
      GPU: {},
      "Miner Log": null,
    },
    Amd: {
      Coin: null,
      Algo: null,
      "Total Hashrate": null,
      "Total Watt": null,
      "Avg Temperature": null,
      "Coin Info": {},
      GPU: [],
      "Miner Log": null,
    },
    CPU: {
      Coins: null,
      Algo: null,
      "Total Hashrate": null,
      "Coin Info": {},
      GPU: [],
      "Miner Log": null,
    },
    "System Config": { Serial: 1 },
    "Coins Config": { Serial: 1 },
    "Overclocks Config": { Serial: 1 },
  };
  const existingDB = await axios.post(urlGet, {
    username: systemConfig["WebApp Username"],
    password: systemConfig["WebApp Password"],
    hostname: systemConfig["Rig Hostname"],
  });
  if (existingDB.data) {
    try {
      await axios.post(urlPost, emptyJson);
    } catch {
      await axios.post(urlPostAlternative, emptyJson);
    }
  }
}

function checkXorg() {
  const lspci = cp
    .execSync("lspci | grep VGA")
    .toString()
    .trim();
  if (/NVIDIA/.test(lspci)) {
    xorgNumber = cp
      .execSync(
        'cat /etc/X11/xorg.conf | grep \'Option         "Coolbits" "28"\' | wc -l',
      )
      .toString()
      .trim();
    gpuNumber = cp
      .execSync("nvidia-smi --query-gpu=gpu_name --format=noheader,csv | wc -l")
      .toString()
      .trim();
    if (!fs.existsSync("./Data")) {
      fs.mkdirSync("./Data");
    }
    if (fs.existsSync("./Data/Init.txt")) {
      var fileExists = true;
    } else {
      var fileExists = false;
      // console.log('Deleting the NTFS partition and resizing root to fullsize.')
      // let disk = cp.execSync("lsblk | grep /ntfs | sed 's/  */ /g' | cut -d' ' -f1 | sed 's/[^a-zA-Z0-9]//g'").toString().trim();
      // if (disk) {
      //   disk = disk.replace(/\d/g, '');
      //   cp.execSync(`sudo umount -l /ntfs`)
      //   cp.execSync(`sudo parted /dev/${disk} rm 4`);
      //   cp.execSync(`sudo growpart /dev/${disk} 3`);
      // }
    }

    if (xorgNumber !== gpuNumber || !fileExists) {
      console.log("Setting up Xorg and Nvidia privileges.");
      cp.execSync(
        "sudo nvidia-xconfig -a --enable-all-gpus --cool-bits=28 --allow-empty-initial-configuration",
      );
      let command = "";
      for (let i = 0; i < gpuNumber; i++) {
        command +=
          "sudo nvidia-settings -a [gpu:" + i + "]/GPUFanControlState=1; ";
      }
      cp.execSync(command);
      fs.writeFileSync("./Data/Init.txt", "");
      cp.execSync("sudo systemctl reboot");
    }
  }
}

async function moveConfig() {
  const disk = cp
    .execSync("sudo blkid | grep 32C01F9958CD98C5 | cut -d':' -f1")
    .toString()
    .trim();
  if (disk) {
    cp.execSync(`sudo mount ${disk} /ntfs`);
    const files = ["Overclocks.json", "SystemConfig.json", "CoinsConfig.json"];
    for (let file of files) {
      if (fs.existsSync(`/ntfs/${file}`)) {
        if (
          fs.statSync(`/home/nos/${file}`).mtimeMs <
          fs.statSync(`/ntfs/${file}`).mtimeMs
        ) {
          cp.execSync(`sudo cp /ntfs/${file} /home/nos/${file}`);
          if (file == "SystemConfig.json")
            systemConfig = require("../SystemConfig.json");
        }
      }
    }
  }

  info = require("./getInfo.js");
  powerControl = require("./PowerController.js");
  ocControl = require("./OverclockController.js");
  tempControl = require("./FanController.js");
  coins = require("./Coins.js");
  watchdog = require("./WatchDog.js");
  shellinabox = require("./shellinabox.js");
  systemConfig = require("../SystemConfig.json");
}

function checkFiles(file1, file2) {
  return fs.statSync(file1).mtimeMs < fs.statSync(file2).mtimeMs;
}
