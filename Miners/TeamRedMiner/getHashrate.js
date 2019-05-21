module.exports = async function() {
  const cp = require("child_process");

  const api = cp
    .execSync('echo \'{"command":"summary+devs"}\' | nc -w 2 localhost 4029')
    .toString();
  let hashrate = {
    "Total Hashrate": api.summary.SUMMARY[0]["KHS 30s"] * 1000
  };

  return hashrate;
};
