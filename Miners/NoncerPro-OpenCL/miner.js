module.exports = function(json, gpuType) {
  let minerCommand;
  if (gpuType == "Amd") {
    minerCommand = {
      Command:
        "--address='ADDRESS' --threads=2 --server=POOL --port=PORT --mode=dump --optimizer --api=true",
      Environment: "",
      "Generated Command":
        "../Miners/NoncePro-OpenCL/noncerpro" +
        " -- --address='" +
        json[gpuType]["Coin Info"]["account"] +
        "'" +
        " --threads=2 " +
        " --server=" +
        json[gpuType]["Coin Info"]["pool1"] +
        " --port=" +
        json[gpuType]["Coin Info"]["port1"] +
        " --mode=dump --optimizer --api=true"
    };
  }

  return minerCommand;
};
