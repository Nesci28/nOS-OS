module.exports = async function() {
  const cp = require("child_process");

  const hashrate = {
    "Total Hashrate": 0,
    Hashrate: []
  };
  try {
    let api = cp
      .execSync('echo \'{"command":"summary+devs"}\' | nc -w 2 localhost 4029')
      .toString();
    api = JSON.parse(api);
    hashrate["Total Hashrate"] =
      (api.summary.SUMMARY[0]["KHS 30s"] * 1000).toFixed(2) + " h/s";

    for (let i = 0; i < api.devs.DEVS.length; i++) {
      hashrate["Hashrate"].push(
        (api.devs.DEVS[i]["KHS 30s"] * 1000).toFixed(2) + " h/s"
      );
    }
  } catch {
  } finally {
    return hashrate;
  }
};
