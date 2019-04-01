// Dependancies
const cp = require('child_process');

if (process.argv[process.argv.length - 1] == 'help') {
  console.log("help   : shows this commands list\n")
  console.log("stats  : shows the streaming information of the system")
  console.log("stop   : stops nOS and the miners")
  console.log("start  : starts nOS and the miners")
  console.log("miner  : shows the log of the miners")
}

if (process.argv[process.argv.length - 1] == 'stats') {
  let stream = cp.spawn('pm2', ['logs', '0', '--raw'])
  stream.stdout.on('data', function (data) {
    console.log(data.toString());
  });
}

if (process.argv[process.argv.length - 1] == 'stop') {
  console.log('Turning OFF nOS')
  kill()
}

if (process.argv[process.argv.length - 1] == 'start') {
  console.log('Turning ON nOS')
  kill()
  cp.execSync(`cd ${findnOS()}; pm2 start LaunchPad.js -- init`)
}

if (process.argv[process.argv.length - 1] == 'miner') {
  (async() => {
    console.log(cp.execSync('tmux capture-pane -pS 40 -e').toString())
  })()
}


function kill() {
  cp.execSync(`cd ${findnOS()}; node LaunchPad.js stop`)
}

function findnOS() {
  return cp.execSync('sudo find /home -name nOS').toString().trim()
}
