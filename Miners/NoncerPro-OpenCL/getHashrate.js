module.exports = async function() {
  const axios = require("../../nOS/node_modules/axios");

  const hashrate = {
    "Total Hashrate": 0,
    Hashrate: []
  };
  try {
    let api = await axios.get("http://localhost:3000/api");
    api = api.data.devices;
    api.forEach(gpu => {
      hashrate.Hashrate.push(Math.round(gpu.hashrate / 1000) + " KH/s");
      hashrate["Total Hashrate"] += +Math.round(gpu.hashrate / 1000);
    });
  } catch {
  } finally {
    hashrate["Total Hashrate"] = hashrate["Total Hashrate"] + " KH/s";
    return hashrate;
  }
};
