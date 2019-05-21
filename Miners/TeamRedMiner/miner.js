module.exports = function(json, gpuType) {
  const minerCommand = {
    Command:
      "-algo ALGO -o stratum+tcp://POOL:PORT -u USERNAME -p PASSWORD --api_listen=4029",
    Environment: "",
    "Generated Command":
      "../Miners/TeamRedMiner/teamredminer" +
      " -- -a " +
      json[gpuType]["Algo"].toLowerCase() +
      " -o stratum+tcp://" +
      json[gpuType]["Coin Info"]["pool1"] +
      ":" +
      json[gpuType]["Coin Info"]["port1"] +
      " -u " +
      json[gpuType]["Coin Info"]["account"] +
      " -p " +
      json[gpuType]["Coin Info"]["password1"] +
      " --api_listen=4029"
  };

  return minerCommand;
};
