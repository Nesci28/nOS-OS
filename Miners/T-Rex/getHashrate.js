const cp = require('child-process')

const hashrate = {
  "Total Hashrate": null,
  "Hashrate": []
}
let minerRes = cp.execSync('echo "summary" | netcat localhost 3800')
minerRes = JSON.parse(minerRes.toString())

hashrate["Total Hashrate"] = (minerRes["hashrate"] / 1000000).toFixed(2) + " MH/s"

for (let x = 0; x < minerRes["gpus"].length; x++) {
  hashrate["Hashrate"].push((minerRes["gpus"][x]["hashrate"] / 1000000).toFixed(2) + " MH/s")
}	

return json