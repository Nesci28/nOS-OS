const fetch = require('node-fetch')

const hashrate = {
  "Total Hashrate": null,
  "Hashrate": []
}
let minerRes = async () => {
  await fetch('http://localhost:3334')
  .then(response => response.json())
}

hashrate["Total Hashrate"] = (minerRes["hashrate"]["total"][0] / 1000000).toFixed(2) + " MH/s"

for (let x = 0; x < minerRes["hashrate"]["threads"].length; x++) {
  hashrate["Hashrate"].push((minerRes["hashrate"]["threads"][x.toString()][0] / 1000000).toFixed(2) + " MH/s")
}

return hashrate