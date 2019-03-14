module.exports = function(json, gpuType) {
	const minerCommand = {
	  "Command": "-a ALGO -o POOL:PORT -u USERNAME -p PASSWORD -b 0.0.0.0:3800",
	  "Environment": "",
	  "Generated Command": "../Miners/T-Rex/t-rex" + " -a " + json[gpuType]["Algo"].toLowerCase() + " -o " + json[gpuType]["Coin Info"]["pool1"] + ":" + json[gpuType]["Coin Info"]["port1"] + " -u " + json[gpuType]["Coin Info"]["account"] + " -p " + json[gpuType]["Coin Info"]["password1"] + " -J -b 0.0.0.0:3800"
	}

	return minerCommand
}


