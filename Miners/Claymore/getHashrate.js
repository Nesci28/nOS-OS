module.exports = async function() {
  const cp = require("child_process");

  const hashrate = {
    "Total Hashrate": 0,
    Hashrate: []
  };
  try {
    let api = cp
      .execSync(
        'echo \'{"id":0,"jsonrpc":"2.0","method":"miner_getstat1"}\' | nc -w 2 localhost 4333'
      )
      .toString();
    api = JSON.parse(api);
    hashrate["Total Hashrate"] =
      parseFloat(api.result[2].split(";")[0] / 1000).toFixed(2) + " MH/s";

    const gpuHashrate = api.result[3].split(";");
    for (let i = 0; i < gpuHashrate.length; i++) {
      hashrate["Hashrate"].push((gpuHashrate[i] / 1000).toFixed(2) + " MH/s");
    }
  } catch {
  } finally {
    return hashrate;
  }
};
