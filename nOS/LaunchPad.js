// Dependancies
const fs = require("fs");
const cp = require("child_process");
// const util = require("util");
const md5File = require("md5-file");
const mv = require("mv");
const wifi = require("node-wifi");
const prettyjson = require("prettyjson");
const prettyjsonOptions = {
  keysColor: "white",
  dashColor: "magenta",
  stringColor: "green",
  numberColor: "yellow"
};

// Requirements
const info = require("./getInfo.js");
const powerControl = require("./PowerController.js");
const ocControl = require("./OverclockController.js");
const tempControl = require("./FanController.js");
const coins = require("./Coins.js");
const watchdog = require("./WatchDog.js");
const DB = require("./DB.js");
const shellinabox = require("./shellinabox.js");
// const showUI = require('./UI.js');
const systemConfig = require("../SystemConfig.json");

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
    json = await info(step, json, counter);
  }

  if (step == "init") {
    cp.execSync("sudo ~/nOS/helpers/ROC-smi/rocm-smi -r");
    cp.execSync("sudo timedatectl set-ntp true");
    shell = await shellinabox(step);
    json.Shellinabox = shell.Shellinabox.URL;
    power = await powerControl(json, step);
    overclocks = await ocControl(json, step);
    coin = await coins(json);
    cp.exec("./tmux.sh && exit &");
    // cp.execSync("termite -e ./tmux.sh && exit &");
    database = await DB(json, "");
  }

  if (counter == 5) {
    overclocks = await ocControl(json, "rxboost", overclocks);
  }

  if (step == "init" || step == "running") {
    var temperature = await tempControl(json, step);
    var watch = await watchdog(json, step);
  }

  if (step == "running") {
    if (counter % 2 == 0) {
      power = await powerControl(json, step, power);
    }
    var existingDB = database.DB.Entry;
    database = await DB(json, existingDB);
  }

  if (counter == 480) {
    counter = 0;
    cp.execSync("sudo timedatectl set-ntp true");
    shell = await shellinabox("shellinabox");
    json.Shellinabox.Ngrok = shell.Shellinabox.URL;
    json.Shellinabox.Localtunnel = shell.Localtunnel.URL;
  }

  // let ui = await showUI(json)
  process.stdout.write("\033c");
  // console.log(ui)
  // console.log(util.inspect(coin, false, null, true));
  // console.log(util.inspect(power, false, null, true));
  console.log(prettyjson.render(coin, prettyjsonOptions));
  console.log("\n");
  console.log(prettyjson.render(power, prettyjsonOptions));
  console.log("\n");
  if (overclocks !== undefined) {
    // console.log(util.inspect(overclocks, false, null, true));
    console.log(prettyjson.render(overclocks, prettyjsonOptions));
    console.log("\n");
  }
  // console.log(util.inspect(temperature, false, null, true));
  // console.log(util.inspect(watch, false, null, true));
  // console.log(database);
  // console.log(shell, counter);
  console.log(prettyjson.render(temperature, prettyjsonOptions));
  console.log("\n");
  // console.log(prettyjson.render(watch, prettyjsonOptions));
  // console.log(prettyjson.render(database, prettyjsonOptions));
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

  if (json.Nvidia.GPU.length > 0) {
    let overclocks = await ocControl(json, "stop");
    console.log(overclocks);
  }

  let temperature = await tempControl(json, "stop");
  console.log(temperature);

  let shell = await shellinabox("stop");
  console.log(shell);

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
      cp.execSync("sudo nvidia-xconfig -a --cool-bits 28");
      let command = "sudo nvidia-settings ";
      for (let i = 0; i < gpuNumber; i++) {
        command += "-a [gpu:" + i + "]/GPUFanControlState=1 ";
      }
      cp.execSync(command);
      cp.execSync("sudo systemctl reboot");
    }
  }
}

function moveConfig() {
  const files = ["Overclocks.json", "SystemConfig.json", "CoinsConfig.json"];
  for (let file of files) {
    if (fs.existsSync(`/ntfs/${file}`)) {
      if (!checkFiles(`/home/nos/${file}`, `/ntfs/${file}`)) {
        move(`${file}`);
      }
    }
  }
}

function checkFiles(file1, file2) {
  return md5File.sync(file1) === md5File.sync(file2);
}

function move(file) {
  mv(`/ntfs/${file}`, `/home/nos/${file}`, function(err) {
    console.log(err);
  });
}
