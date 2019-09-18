const cp = require("child_process");

module.exports = async function restart() {
  // const startOutput = start();
  // startOutput.stdout.on("data", data => {
  //   console.log(data.toString().trim());
  // });
  const pm2List = JSON.parse(cp.execSync('pm2 jlist').toString().trim());
  pm2List.forEach(proc => {
    if (proc.name === 'minerCpu' || proc.name === 'minerAmd' || proc.name === 'minerNvidia') {
      cp.execSync(`pm2 stop ${proc.name}`);
    }
  });
  cp.execSync(`pm2 restart LaunchPad -- init`);
};

// function start() {
//   return cp.exec(
//     `cd ${findnOS()}; DISPLAY=:0 XAUTHORITY=${findXAuthority()} ./start.sh`
//   );
// }

// function findnOS() {
//   return cp
//     .execSync("sudo find /home -name nOS")
//     .toString()
//     .trim();
// }

// function findXAuthority() {
//   return cp
//     .execSync(
//       "ps -u $(id -u) -o pid= | xargs -I{} cat /proc/{}/environ 2>/dev/null | tr '\\0' '\\n' | grep -m1 '^XAUTHORITY='"
//     )
//     .toString()
//     .trim()
//     .split("=")[1];
// }