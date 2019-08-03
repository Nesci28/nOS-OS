module.exports = async function() {
  const cp = require("child_process");

  const hashrate = {
    "Total Hashrate": 0,
    Hashrate: []
  };
  try {
    let minerRes = cp.execSync('echo "summary" | nc localhost 3800');
    minerRes = JSON.parse(minerRes.toString());

    hashrate["Total Hashrate"] =
      (minerRes["hashrate"] / 1000000).toFixed(2) + " MH/s";

    for (let x = 0; x < minerRes["gpus"].length; x++) {
      hashrate["Hashrate"].push(
        (minerRes["gpus"][x]["hashrate"] / 1000000).toFixed(2) + " MH/s"
      );
    }
  } catch {
  } finally {
    return hashrate;
  }
};
