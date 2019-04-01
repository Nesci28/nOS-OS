module.exports = async function(json) {
	// Dependancies
	const fs = require('fs');
	const cp = require('child_process');

	// Configs Files Parser
	const systemConfig = require('../SystemConfig.json');

	let coinsJson = {
		"Coins": {
			"Nvidia": {
				"Coin": null,
				"Algo": null,
				"Miner": null,
				"Command": null
			},
			"Amd": {
				"Coin": null,
				"Algo": null,
				"Miner": null,
				"Command": null
			}
		}
	}

	// Setup
	const setType = []
	if (json.Nvidia.GPU.length > 0) setType[0] = "Nvidia"
	if (json.Amd.GPU.length > 0) setType[1] = "Amd"
	setType[2] = "Cpu"

	// Coins
	const coinsArr = ["", "", ""]
	if (systemConfig["Nvidia Coin"]) coinsArr[0] = systemConfig["Nvidia Coin"]
	if (systemConfig["Amd Coin"]) coinsArr[1]= systemConfig["Amd Coin"]
	if (systemConfig["Cpu Coin"]) coinsArr[2] = systemConfig["Cpu Coin"]

	// Pill
	const pill = systemConfig["EthPill"]
	if (pill == true) {
		let pillGpu = ''
		let name = ''
		for (let i = 0; i < json.Nvidia.GPU.length; i++) {
			name = json.Nvidia.GPU[i].Name
			if (name.toLowerCase().includes("1080"|"1080ti")) {
				pillGpu = true
			}
		}
	}



	try {		
		let minerError;
		for (let i = 0; i < coinsArr.length; i++) {
			if (coinsArr[i] && setType[i]) {
				let gpuType = setType[i]
				let coin = coinsArr[i]
				
				// Closing the already running miner
				let screenName = await ifexist(gpuType, "start")
				if (screenName) {
					cp.execSync(`kill ${screenName}`)
				}
				
				// Get the miner informations
				let minerJS = require('../Miners/' + json[gpuType]["Coin Info"]["miner"] + '/miner.js')
				let minerInfo = await minerJS(json, gpuType)
				// console.log(minerInfo)

				json[gpuType]["Coin Info"]["env"] = minerInfo["Environment"]
				json[gpuType]["Coin Info"]["command"] = minerInfo["Generated Command"]

				// Show the UI
				await showUI(gpuType, coin, json, "main")

				// Get the final command line to run the miner
				let finalCommand = await run(json, gpuType)
				//console.log(finalCommand)
				cp.execSync(finalCommand)

				// Debug section
				// 1) Check if the screen as been created 
				screenExist = await ifexist(gpuType, "main")

				// Serving the pill
				if (gpuType == "NVIDIA" && !minerError && !ifexist("ethpill", "start")) {
					let finalPill = await servingPill(pillGpu)
					if (finalPill) cp.execSync(finalPill)
				}

				// Running TmuxVanity
				// if (!minerError) {
				// 	cp.execSync("/home/chosn/CHOSN/TmuxVanity")
				// }
			}
		}
	} catch(err) {
		console.error("Threw error", err.stack)
	}
	return coinsJson

	// Show the ui
	function showUI(gpuType, coin, json, section) {
		if (section == "main") {
			coinsJson["Coins"][gpuType]["Coin"] = json[gpuType]["Coin"]
			coinsJson["Coins"][gpuType]["Algo"] = json[gpuType]["Algo"]
			coinsJson["Coins"][gpuType]["Miner"] = json[gpuType]["Coin Info"]["miner"]
			coinsJson["Coins"][gpuType]["Command"] = json[gpuType]["Coin Info"]["command"]
		}
	}

	// Run the command line
	function run(json, gpuType) {
		let screenRcm = ''

		if (gpuType == "Nvidia"){
			processName = "minerNvidia"
			// screenRcm = "../Logs/minerNvidia.txt"
			// screenRcmBck = "../Logs/backups/minerNvidia.txt"
		} else if (gpuType == "Amd") {
			processName = "minerAmd"
			// screenRcm = "../Logs/minerAmd.txt"
			// screenRcmBck = "../Logs/backups/minerAmd.txt"
		} else {
			processName = "minerCpu"
			// screenRcm = "../Logs/minerCpu.txt"
			// screenRcmBck = "../Logs/backups/minerCpu.txt"
		}

		// if (fs.existsSync(screenRcm)) {
		// 	fs.rename(screenRcm, screenRcmBck, function (err) {
		// 		if (err) throw err;
		// 	});
		// }

		return `screen -dmS ${processName} ${json[gpuType]["Coin Info"]["command"]}`
	}

	// Check if the screen as been created
	function ifexist(gpuType, section) {
		screenName = gpuType == "Nvidia" ? 'minerNvidia' : gpuType == "Amd" ? 'minerAmd' : gpuType == "ethpill" ? 'ethpill' : 'minerCpu'
		let screenOutput
		try {
			screenOutput = cp.execSync(`screen -ls ${screenName}`).toString().trim().split("\n")[1].trim().split('.')[0]
		} catch (ex) {
			if (section !== "start") console.log(chalk.redBright("Error, trying to fix the issue automatically"))
			return
		}
		return screenOutput
	}

	// Serving the Pill
	function servingPill(pillGpu) {
		if (pillGpu) {
			console.log(chalk.whiteBright("Serving the pill..."))
			return "screen -dmS ethpill sudo /opt/EthPill/OhGodAnETHlargementPill-r2"
		}
	}
}


