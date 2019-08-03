module.exports = function(json, gpuType) {
  let minerCommand;
  if (gpuType == "Nvidia") {
    minerCommand = {
      Command: "-epool STRATUM:PORT -ewal ADDRESS -epsw PASSWORD -mport -4333",
      Environment: "",
      "Generated Command":
        "../Miners/Claymore/ethdcrminer64" +
        " -- -epool " +
        json[gpuType]["Coin Info"]["pool1"] +
        ":" +
        json[gpuType]["Coin Info"]["port1"] +
        " -ewal " +
        json[gpuType]["Coin Info"]["account"] +
        " -epsw " +
        json[gpuType]["Coin Info"]["password1"] +
        " -mport -4333" +
        " -platform 2" +
        " -dbg -1"
    };
  } else {
    minerCommand = {
      Command: "-epool STRATUM:PORT -ewal ADDRESS -epsw PASSWORD -mport -4333",
      Environment: "",
      "Generated Command":
        "../Miners/Claymore/ethdcrminer64" +
        " -- -epool " +
        json[gpuType]["Coin Info"]["pool1"] +
        ":" +
        json[gpuType]["Coin Info"]["port1"] +
        " -ewal " +
        json[gpuType]["Coin Info"]["account"] +
        " -epsw " +
        json[gpuType]["Coin Info"]["password1"] +
        " -mport -4333" +
        " -platform 1" +
        " -dbg -1"
    };
  }

  return minerCommand;
};
