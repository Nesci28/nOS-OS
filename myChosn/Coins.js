// Dependancies
const fs = require('fs')
const chalk = require('chalk')
const cp = require('child_process')

// Configs Files Parser
const systemConfig = require('../SystemConfig.json')
const info = require('./getInfo.js')

// Setup
const setType = []
const lspci = cp.execSync("lspci | grep VGA").toString().trim()
if (/NVIDIA/.test(lspci)) setType[0] = "Nvidia"
if (/AMD/.test(lspci)) setType[1] = "Amd"
setType[2] = "Cpu"

const pill = systemConfig["EthPill"]

const nvidia = cp.execSync("nvidia-smi -L").toString().trim().split("\n")
const nvidiaList = {}
let pillGpu = ''
for (let i = 0; i < nvidia.length; i++) {
	nvidiaList[i] = nvidia[i].match(/\: (.*) \(/)[1]
	if (nvidia[i].toLowerCase().includes("1080"|"1080ti")) {
		pillGpu = true
	}
}

// Coins
const coinsArr = ["", "", ""]
if (systemConfig["Nvidia Coin"]) coinsArr[0] = systemConfig["Nvidia Coin"]
if (systemConfig["Amd Coin"]) coinsArr[1]= systemConfig["Amd Coin"]
if (systemConfig["Cpu Coin"]) coinsArr[2] = systemConfig["Cpu Coin"]

// Main
async function main() {
	try {		
		let minerError;
		for (let i = 0; i < coinsArr.length; i++) {
			if (coinsArr[i] && setType[i]) {
				let gpuType = setType[i]
				let coin = coinsArr[i]
				
				// Closing the already running miner
				var screenName = await ifexist(gpuType, "start")
				if (screenName) {
					cp.execSync(`kill ${screenName}`)
				}

				// Get all the coin informations
				let coinInfo = await info
				
				// Get the miner informations
				let minerJS = require('../Miners/' + coinInfo[gpuType]["Coin Info"]["miner"] + '/miner.js')
				let minerInfo = await minerJS(coinInfo, gpuType)
				// console.log(minerInfo)

				coinInfo[gpuType]["Coin Info"]["env"] = minerInfo["Environment"]
				coinInfo[gpuType]["Coin Info"]["command"] = minerInfo["Generated Command"]

				// Show the UI
				await showUI(gpuType, coin, coinInfo, "main")
				
				// Deleting the old logs
				if (fs.existsSync(`/home/chosn/Logs/screenlog.${i}`)) {
					cp.execSync(`mv /home/chosn/Logs/screenlog.${i} /home/chosn/backups/screenlog.${i}_bck`)
				}

				// Get the final command line to run the miner
				let finalCommand = await run(coinInfo, gpuType)
				//console.log(finalCommand)
				cp.execSync(finalCommand)

				// Debug section
				// 1) Check if the screen as been created 
				screenExist = await ifexist(gpuType, "main")

				// 2) Check for any error in the miner app
					// Decided it was WatchDog's Job
				//minerError = await checkError(gpuType)

				// Serving the pill
				if (gpuType == "NVIDIA" && !minerError && !ifexist("ethpill", "start")) {
					let finalPill = await servingPill()
					if (finalPill) cp.execSync(finalPill)
				}

				// Running TmuxVanity
				if (!minerError) {
					cp.execSync("/home/chosn/CHOSN/TmuxVanity")
				}
			}
		}
	} catch(err) {
		console.error("Threw error", err.stack)
	}
}

main()

// functions
	// Show the ui
function showUI(gpuType, coin, coinInfo, section) {
	if (section == "main") {
		if (gpuType == "Nvidia") console.log(chalk.whiteBright('**********') + chalk.greenBright(' NVIDIA ') + chalk.whiteBright('**********'))
		if (gpuType == "Amd") console.log(chalk.whiteBright('************') + chalk.redBright(' AMD ') + chalk.whiteBright('***********'))
		if (gpuType == "Cpu") console.log(chalk.whiteBright('************') + chalk.blueBright(' CPU ') + chalk.whiteBright('***********'))
		console.log(chalk.whiteBright('Coin : ') + chalk.yellowBright(coinInfo[gpuType]["Coin"]))
		console.log(chalk.whiteBright('Algo : ') + chalk.yellowBright(coinInfo[gpuType]["Algo"]))
		console.log(chalk.whiteBright('Miner : ') + chalk.yellowBright(coinInfo[gpuType]["Coin Info"]["miner"]))
		console.log(chalk.whiteBright('Command : ') + chalk.yellowBright(coinInfo[gpuType]["Coin Info"]["command"]))
		if (gpuType == "Nvidia") console.log(chalk.whiteBright('*******') + chalk.greenBright(' End of NVIDIA ') + chalk.whiteBright('*******'))
		if (gpuType == "Amd") console.log(chalk.whiteBright('*********') + chalk.redBright(' End of AMD ') + chalk.whiteBright('********'))
		if (gpuType == "Cpu") console.log(chalk.whiteBright('*********') + chalk.blueBright(' End of CPU ') + chalk.whiteBright('********'))
	}
}

	// Run the command line
function run(coinInfo, gpuType, screen = '', screenRcm = '') {
	if (gpuType == "Nvidia"){
		screen = "miner_nvidia"
		screenRcm = "../Logs/miner_nvidia.txt"
		screenRcmBck = "../Logs/backups/miner_nvidia.txt"
	} else if (gpuType == "Amd") {
		screen = "miner_amd" 
		screenRcm = "../Logs/miner_amd.txt"
		screenRcmBck = "../Logs/backups/miner_amd.txt"
	} else {
		screen = "miner_cpu"
		screenRcm = "../Logs/miner_cpu.txt"
		screenRcmBck = "../Logs/backups/miner_cpu.txt"
	}

	if (fs.existsSync(screenRcm)) {
		cp.execSync(`mv ${screenRcm} ${screenRcmBck}.bck`)
		cp.execSync(`touch ${screenRcm}`)
	}

	return "screen -L -Logfile " + screenRcm + " -dmSL " + screen + " " + coinInfo[gpuType]["Coin Info"]["command"]
}

	// Check if the screen as been created
function ifexist(gpuType, section) {
	screenName = gpuType == "Nvidia" ? 'miner_nvidia' : gpuType == "Amd" ? 'miner_amd' : gpuType == "ethpill" ? 'ethpill' : 'miner_cpu'
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
function servingPill() {
	if (!pill.toLowerCase() == "yes" || !pillGpu) {
		return
	}
	console.log(chalk.whiteBright("Serving the pill..."))
	return "screen -dmS ethpill sudo /opt/EthPill/OhGodAnETHlargementPill-r2"
}

	// Miscelenuous
	  // Timer
async function sleep(ms) {
	return new Promise(function(resolve, reject) {
		setTimeout(function(){
			resolve()
		}, ms)
	})
}
