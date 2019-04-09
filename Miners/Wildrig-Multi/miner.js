module.exports = function(json, gpuType) {
	const minerCommand = {
	  "Command": "--algo ALGO --url POOL:PORT --user USERNAME --pass PASSWORD --api-port 3334 --donate-level 1",
	  "Environment": "",
	  "Generated Command": "../Miners/Wildrig-Multi/wildrig-multi" + " -- --algo " + json[gpuType]["Algo"].toLowerCase() + " --url " + json[gpuType]["Coin Info"]["pool1"] + ":" + json[gpuType]["Coin Info"]["port1"] + " --user " + json[gpuType]["Coin Info"]["account"] + " --pass " + json[gpuType]["Coin Info"]["password1"] + " --api-port 3334 --donate-level 1"
	}

	return minerCommand
}


