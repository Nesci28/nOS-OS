const cp = require('child_process');

(async() => {
  try {
    if (cp.execSync('tmux list-sessions | grep miner').toString().trim()) cp.execSync('tmux kill-session -t miner')
  } catch {}
  let jlist = JSON.parse(cp.execSync('pm2 jlist').toString().trim())
  console.log(jlist.length)
  if (jlist.length > 0) {
    cp.execSync('tmux new-session -A -s miner', (error, stdout, stderr) => {
      console.log(stdout, stderr)
      const minerName = ["minerNvidia", "minerAmd", "minerCpu"]
      for (let i = 0; i < jlist.length; i++) {
        console.log(i)
        if (i > 0) cp.execSync('tmux split-window -t miner')
        if (minerName.includes(jlist[i].name)) cp.execSync(`tmux send-keys -t ${i} pm2 logs jlist[${i}].name --raw Enter`)
      }
    })
    }
  })()

process.exit()