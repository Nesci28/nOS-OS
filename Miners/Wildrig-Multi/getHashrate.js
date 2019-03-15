module.exports = async function() {
  const axios = require('../../nOS/node_modules/axios');

  const hashrate = {
    "Total Hashrate": null,
    "Hashrate": []
  };

  let minerRes = await axios.get('http://localhost:3334')
  minerRes = minerRes.data
  hashrate["Total Hashrate"] = (minerRes["hashrate"]["total"][0] / 1000000).toFixed(2) + " MH/s"
  
  for (let x = 0; x < minerRes["hashrate"]["threads"].length; x++) {
    hashrate["Hashrate"].push((minerRes["hashrate"]["threads"][x.toString()][0] / 1000000).toFixed(2) + " MH/s")
  }
  
  return hashrate
}
