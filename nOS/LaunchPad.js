// Dependancies
const fs = require("fs");
const cp = require("child_process");
// const util = require("util");
const md5File = require("md5-file");
const wifi = require("node-wifi");
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
      console.log("[1/9] Fetching the new informations");
    } else if (counter == 5 || counter % 2 == 0) {
      console.log("[1/5] Fetching the new informations");
    } else {
      console.log("[1/4] Fetching the new informations");
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
    console.log("[5/9] Launching the miner(s)");
    coin = await coins(json);
    console.log("[6/9] Setting up tmux");
    cp.exec("./tmux.sh && exit &");
    // cp.execSync("termite -e ./tmux.sh && exit &");
    console.log("[7/9] Sending the newest values to the WebUI");
    database = await DB(json, "");
  }

  if (counter == 5) {
    console.log("[2/5] Configuring the GPU(s) Overclocks (second pass)");
    overclocks = await ocControl(json, "rxboost", overclocks);
  }

  if (step == "init" || step == "running") {
    if (step == "init") {
      console.log("[8/9] Configuring the GPU(s) Temperature");
    } else if (counter == 5) {
      console.log("[3/5] Configuring the GPU(s) Temperature");
    } else if (counter % 2 == 0) {
      console.log("[2/5] Configuring the GPU(s) Temperature");
    } else {
      console.log("[2/4] Configuring the GPU(s) Temperature");
    }
    var temperature = await tempControl(json, step);
    if (step == "init") {
      console.log("[9/9] Starting Watchdog");
    } else if (counter == 5) {
      console.log("[4/5] Checking Watchdog");
    } else if (counter % 2 == 0) {
      console.log("[3/5] Checking Watchdog");
    } else {
      console.log("[3/4] Checking Watchdog");
    }
    var watch = await watchdog(json, step);
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
    shell = await shellinabox("shellinabox");
    json.Shellinabox.Ngrok = shell.Ngrok.URL;
  }

  process.stdout.write("\033c");
  console.log(prettyjson.render(coin, prettyjsonOptions));
  console.log("\n");
  console.log(prettyjson.render(power, prettyjsonOptions));
  console.log("\n");
  if (overclocks !== undefined) {
    console.log(prettyjson.render(overclocks, prettyjsonOptions));
    console.log("\n");
  }
  console.log(prettyjson.render(temperature, prettyjsonOptions));
  console.log("\n");
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
    "Launchpad",
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
