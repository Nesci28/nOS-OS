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
  numberColor: "yellow"
};

// Requirements
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
    await checkXorg();
    await moveConfig();
    if (systemConfig["Wifi Name"] && systemConfig["Wifi Password"]) {
      network = await connection(
        systemConfig["Wifi Name"],
        systemConfig["Wifi Password"]
      );
    }
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
  shell = ""
) {
  if (step !== "shellinabox") {
    process.stdout.write("\033c");
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
    cp.execSync("sudo timedatectl set-ntp true");
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
    database = await DB(json, "");
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
    watch = await watchdog(json, step);
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
    database = await DB(json, existingDB);
  }

  if (counter == 480) {
    counter = 0;
    cp.execSync("sudo timedatectl set-ntp true");
    console.log("[5/5] Shellinabox");
    shell = await shellinabox("ngrok", shell);
    json.Shellinabox.Ngrok.URL = shell.Ngrok.URL;
  }

  process.stdout.write("\033c");
  if (json.Nvidia.GPU.length > 0 && json.Amd.GPU.length > 0) {
    console.log(prettyjson.render(coin, prettyjsonOptions));
    console.log(prettyjson.render(power, prettyjsonOptions));
    if (overclocks !== undefined) {
      console.log(prettyjson.render(overclocks, prettyjsonOptions));
    }
    console.log(prettyjson.render(temperature, prettyjsonOptions));
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
  }

  if (json.Nvidia.GPU.length == 0 && json.Amd.GPU.length > 0) {
    let coinAmd = cloneDeep(coin);
    delete coinAmd.Coins.Amd;
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
  }

  console.log(prettyjson.render(shell, prettyjsonOptions));
  console.log("\n");
  console.log("Ngrok Counter: " + counter);

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
      counter
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

  cp.execSync("pm2 kill");
  cp.execSync("rm -rf ~/.pm2/logs/*");
  cp.execSync("pm2 flush");

  const pm2Processes = [
    "LaunchPad",
    "minerNvidia",
    "minerAmd",
    "minerCpu",
    "ethpill"
  ];
  for (let PIDS of pm2Processes) {
    let pm2List = cp.execSync(
      `ps aux | grep pm2 | grep ${PIDS} | grep "node" | sed 's/  */ /g' | cut -d ' ' -f2`
    );
    pm2List = pm2List
      .toString()
      .trim()
      .split("\n");
    for (let ID of pm2List) {
      try {
        cp.execSync(`kill ${ID}`);
      } catch {}
    }
  }

  try {
    if (
      cp
        .execSync("tmux list-sessions | grep miner")
        .toString()
        .trim()
    ) {
      cp.execSync("tmux kill-session -t miner");
    }
  } catch {}
}

async function connection(ssid, password) {
  require("dns").resolve("www.google.com", async function(err) {
    if (err) {
      console.log("No connection");
      await wifi.init({
        iface: null // network interface, choose a random wifi interface if set to null
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
      Ngrok: null,
      Localtunnel: null
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
      "Miner Log": null
    },
    Amd: {
      Coin: null,
      Algo: null,
      "Total Hashrate": null,
      "Total Watt": null,
      "Avg Temperature": null,
      "Coin Info": {},
      GPU: {},
      "Miner Log": null
    },
    CPU: {
      Coins: null,
      Algo: null,
      "Total Hashrate": null,
      "Coin Info": {},
      GPU: {},
      "Miner Log": null
    },
    "System Config": { serial: 1 },
    "Coins Config": { serial: 1 },
    "Overclocks Config": { serial: 1 }
  };
  const existingDB = await axios.post(urlGet, {
    username: systemConfig["WebApp Username"],
    password: systemConfig["WebApp Password"],
    hostname: systemConfig["Rig Hostname"]
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
        'cat /etc/X11/xorg.conf | grep \'Option         "Coolbits" "28"\' | wc -l'
      )
      .toString()
      .trim();
    gpuNumber = cp
      .execSync("nvidia-smi --query-gpu=gpu_name --format=noheader,csv | wc -l")
      .toString()
      .trim();
    if (fs.existsSync("./Data/Init.txt")) {
      var fileExists = true;
    } else {
      var fileExists = false;
      fs.writeFileSync("./Data/Init.txt", "");
    }

    if (xorgNumber !== gpuNumber || !fileExists) {
      cp.execSync(
        "sudo nvidia-xconfig -a --enable-all-gpus --cool-bits=28 --allow-empty-initial-configuration"
      );
      let command = "sudo nvidia-settings ";
      for (let i = 0; i < gpuNumber; i++) {
        command += "-a [gpu:" + i + "]/GPUFanControlState=1 ";
      }
      cp.execSync(command);
      cp.execSync("sudo systemctl reboot");
    }
  }
}

async function moveConfig() {
  const files = ["Overclocks.json", "SystemConfig.json", "CoinsConfig.json"];
  for (let file of files) {
    if (fs.existsSync(`/ntfs/${file}`)) {
      if (!checkFiles(`/home/nos/${file}`, `/ntfs/${file}`)) {
        cp.execSync(`sudo mv /ntfs/${file} /home/nos/${file}`);
        if (file == "SystemConfig.json") {
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
  return md5File.sync(file1) === md5File.sync(file2);
}
