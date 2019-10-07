// Dependancies
const cp = require("child_process");
const readLastLines = require("read-last-lines");

const getInfo = require("./getInfo.js");
const restart = require("./restart");

if (process.argv[process.argv.length - 1] == "help") {
  console.log("help   : shows this commands list\n");
  console.log("stats  : shows the streaming information of the system");
  console.log("miner  : shows the log of the miners");
  console.log("hash   : shows the current hashrate");
  console.log("stop   : stops nOS and the miners");
  console.log("start  : starts nOS and the miners");
}

if (process.argv[process.argv.length - 1] == "stats") {
  let stream = cp.spawn("pm2", ["logs", "0", "--raw"]);
  stream.stdout.on("data", function(data) {
    console.log(data.toString());
  });
}

if (process.argv[process.argv.length - 1] == "stop") {
  console.log("Turning OFF nOS");
  kill();
  process.exit();
}

if (process.argv[process.argv.length - 1] == "start") {
  console.log("Turning ON nOS");
  restart();
}

if (process.argv[process.argv.length - 1] == "miner") {
  return (async () => {
    const logs = await getMinerLog();
    for (log in logs) {
      console.log(logs[log]);
    }
    process.exit();
  })();
}

async function getMinerLog(brand) {
  const minerLogs = {
    Nvidia: "",
    Amd: "",
    CPU: "",
  };

  try {
    const brands = ["Nvidia", "Amd", "CPU"];
    for (let brand of brands) {
      let jlist = JSON.parse(cp.execSync("pm2 jlist").toString());
      for (let i = 0; i < jlist.length; i++) {
        if (jlist[i].name == `miner${brand}`) {
          let minerLog = await readLastLines.read(
            `/home/nos/.pm2/logs/miner${brand}-out.log`,
            15,
          );
          minerLogs[brand] = minerLog;
        }
      }
    }
  } catch {}
  return minerLogs;
}

if (process.argv[process.argv.length - 1] == "hash") {
  (async () => {
    let json = await getInfo("ssh");
    if (json.Nvidia.GPU.length > 0)
      console.log("Nvidia Total Hashrate: ", json.Nvidia["Total Hashrate"]);
    if (json.Amd.GPU.length > 0)
      console.log("Amd Total Hashrate:", json.Amd["Total Hashrate"]);
    if (json.CPU["Total Hashrate"])
      console.log("CPU Total Hashrate:", json.CPU["Total Hashrate"]);
    process.exit();
  })();
}

function kill() {
  return cp.execSync(
    `cd ${findnOS()}; DISPLAY=:0 XAUTHORITY=${findXAuthority()} node LaunchPad.js stop`,
  );
}

function start() {
  return cp.exec(
    `cd ${findnOS()}; DISPLAY=:0 XAUTHORITY=${findXAuthority()} ./start.sh`,
  );
}

function findXAuthority() {
  return cp
    .execSync(
      "ps -u $(id -u) -o pid= | xargs -I{} cat /proc/{}/environ 2>/dev/null | tr '\\0' '\\n' | grep -m1 '^XAUTHORITY='",
    )
    .toString()
    .trim()
    .split("=")[1];
}

function findnOS() {
  return cp
    .execSync("sudo find /home -name nOS")
    .toString()
    .trim();
}
