module.exports = function(coinInfo, gpuType) {
	const minerCommand = {
	  "Command": "-a ALGO -o POOL:PORT -u USERNAME -p PASSWORD -b 0.0.0.0:3800",
	  "Environment": "",
	  "Generated Command": "../Miners/T-Rex/t-rex" + " -a " + coinInfo[gpuType]["Algo"].toLowerCase() + " -o " + coinInfo[gpuType]["Coin Info"]["pool1"] + ":" + coinInfo[gpuType]["Coin Info"]["port1"] + " -u " + coinInfo[gpuType]["Coin Info"]["account"] + " -p " + coinInfo[gpuType]["Coin Info"]["password1"] + " -b 0.0.0.0:3800"
	}

	return minerCommand
}


