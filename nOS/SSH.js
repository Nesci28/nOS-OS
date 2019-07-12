// Dependancies
const cp = require("child_process");

const getInfo = require("./getInfo.js");

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
  kill();
  cp.exec(
    `cd ${findnOS()}; DISPLAY=:0 XAUTHORITY=/home/nos/.Xauthority ./start.sh`
  );
  process.exit();
}

if (process.argv[process.argv.length - 1] == "miner") {
  (async () => {
    let tmux = await cp
      .execSync("tmux has-sessions -t miners 2>/dev/null; echo $?")
      .toString()
      .trim();
    if (tmux == 0)
      console.log(cp.execSync("tmux capture-pane -pS 40 -e").toString());
  })();
  process.exit();
}

if (process.argv[process.argv.length - 1] == "hash") {
  (async () => {
    let json = await getInfo();
    if (json.Nvidia.GPU.length > 0) console.log(json.Nvidia["Total Hashrate"]);
    if (json.Amd.GPU.length > 0) console.log(json.Amd["Total Hashrate"]);
    if (json.CPU["Total Hashrate"]) console.log(json.CPU["Total Hashrate"]);
    process.exit();
  })();
}

function kill() {
  const xauthority = cp.execSync;
  cp.execSync(
    `cd ${findnOS()}; DISPLAY=:0 XAUTHORITY=/home/nos/.Xauthority node LaunchPad.js stop`
  );
}

function findnOS() {
  return cp
    .execSync("sudo find /home -name nOS")
    .toString()
    .trim();
}
