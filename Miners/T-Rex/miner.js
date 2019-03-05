module.exports = function(coinInfo, gpuType) {
	console.log(coinInfo)
	const minerCommand = {
	  "Command": "-a ALGO -o POOL:PORT -u USERNAME -p PASSWORD -b 3800",
	  "Environment": "LD_PRELOAD=libcurl.so.3",
	  "Generated Command": "LD_PRELOAD=libcurl.so.3 " + "../Miners/T-Rex/t-rex" + " -a " + coinInfo[gpuType]["Algo"].toLowerCase() + " -o " + coinInfo[gpuType]["Coin Info"]["pool1"] + ":" + coinInfo[gpuType]["Coin Info"]["port1"] + " -u " + coinInfo[gpuType]["Coin Info"]["account"] + " -p " + coinInfo[gpuType]["Coin Info"]["password1"] + " -b 3800"
	}

	console.log(minerCommand)
	return minerCommand
}


