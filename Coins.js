// Dependancies
const fs = require('fs')
const parser = require('parse-ini')
const chalk = require('chalk')
const cp = require('child_process')
const CoinsMiners = require('/home/chosn/CHOSN/WebSock/private/lib/coins_miners.js')
var ProgressBar = require('progress');

// Configs Files Parser
const systemConfig = parser.parse('/home/chosn/System_Config')
const coinsConfig = parser.parse('/home/chosn/Coins_Config')
const minersJson = CoinsMiners.read()

// Setup
const setType = []
const lspci = cp.execSync("lspci | grep VGA").toString().trim()
if (/NVIDIA/.test(lspci)) setType[0] = "NVIDIA"
if (/AMD/.test(lspci)) setType[1] = "AMD"
setType[2] = "CPU"

let version = cp.execSync("WebClient prem_check").toString().trim()
if (version == "BASIC") version = ''
if (version == "PREM") version = '_PREM'

const pill = systemConfig.ETHLargement.match("\"(.*)\"")[1]

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
const coinsArr = []
if (systemConfig.COIN_NVIDIA.match("\"(.*)\"")[1]) coinsArr.push(systemConfig.COIN_NVIDIA.match("\"(.*)\"")[1])
if (systemConfig.COIN_AMD.match("\"(.*)\"")[1]) coinsArr.push(systemConfig.COIN_AMD.match("\"(.*)\"")[1])
if (systemConfig.COIN_CPU.match("\"(.*)\"")[1]) coinsArr.push(systemConfig.COIN_CPU.match("\"(.*)\"")[1])

// Main
async function main() {
	try {		
		let minerError;
		for (let i = 0; i < coinsArr.length; i++) {
			if (coinsArr[i] && setType[i]) {
				const gpuType = setType[i]
				const coin = coinsArr[i]
				
				// Closing the already running miner
				var screenName = await ifexist(gpuType, "start")
				if (screenName) {
					cp.execSync(`kill ${screenName}`)
				}

				// Get all the coin informations
				const coinInfo = await getCoinInfo(coin, gpuType, version)
				//console.log(coinInfo)
				
				// Show the UI
				await showUI(gpuType, coin, coinInfo, "main")
				
				// Deleting the old logs
				if (fs.existsSync(`/home/chosn/Logs/screenlog.${i}`)) {
					cp.execSync(`mv /home/chosn/Logs/screenlog.${i} /home/chosn/backups/screenlog.${i}_bck`)
				}

				// Get the final command line to run the miner
				const finalCommand = await run(coinInfo, gpuType)
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
					const finalPill = await servingPill()
					cp.execSync(finalPill)
				}

				// Running TmuxVanity
				if (!minerError) {
					cp.execSync("sudo /home/chosn/CHOSN/ttyecho -n /dev/pts/2 /home/chosn/CHOSN/TmuxVanity")
				}
			}
		}
	} catch(err) {
		console.error("Threw error", err.stack)
	}
}

main()

// functions
	// extracts all the coin information from Coins_Config and returns a JSON
function getCoinInfo(coin, gpuType, version) {
	const coinInfo = {}
	
	// Getting the coin information
	coinInfo["algo"] = eval("coinsConfig." + coin + "_ALGO").match("\"(.*)\"")[1]
	coinInfo["opts"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_OPTS").match("\"(.*)\"")[1]
	coinInfo["worker1"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_WORKER").match("\"(.*)\"")[1]
	coinInfo["address1"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_ADDRESS").match("\"(.*)\"")[1]
	if (coinInfo["worker1"] && coinInfo["address1"]) coinInfo["address1"] = coinInfo["address1"] + "." + coinInfo["worker1"]
	coinInfo["poolUri1"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_POOL_URI").match("\"(.*)\"")[1]
	coinInfo["pool1"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_POOL").match("\"(.*)\"")[1]
	coinInfo["port1"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_PORT").match("\"(.*)\"")[1]
	coinInfo["poolstratum1"] = coinInfo.pool1 + ":" + coinInfo.port1
	coinInfo["password1"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_PASSWORD").match("\"(.*)\"")[1]
	coinInfo["worker2"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_WORKER2").match("\"(.*)\"")[1]
	coinInfo["address2"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_ADDRESS2").match("\"(.*)\"")[1]
	if (coinInfo["worker2"] && coinInfo["address2"]) coinInfo["address2"] = coinInfo["address2"] + "." + coinInfo["worker2"]
	coinInfo["poolUri2"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_POOL_URI2").match("\"(.*)\"")[1]
	coinInfo["pool2"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_POOL2").match("\"(.*)\"")[1]
	coinInfo["port2"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_PORT2").match("\"(.*)\"")[1]
	coinInfo["poolstratum2"] = coinInfo.pool2 + ":" + coinInfo.port2
	coinInfo["password2"] = eval("coinsConfig." + coin + "_" + coinInfo.algo + "_PASSWORD2").match("\"(.*)\"")[1]

	// Getting the miner information for Nvidia and Amd
	if (gpuType !== "CPU") {
		coinInfo["miner"] = minersJson["User"][coinInfo.algo][gpuType + version]
		coinInfo["path"] = minersJson["Miners"][coinInfo.miner]["Path"]
		coinInfo["command"] = minersJson["Miners"][coinInfo.miner]["Command"]
	}

	// Getting the miner information for CPU
	if (gpuType == "CPU") { 
		coinInfo["miner"] = minersJson["CPU"]["User"]["Name"]
		coinInfo["path"] = minersJson["CPU"]["User"]["Path"]
		coinInfo["command"] = minersJson["CPU"]["User"]["Command"]
	}

	// Generating the stuff to launch the miner
	coinInfo["commandGenerated"] = coinInfo["command"]
		.replace(/\${ALGO,,}|\${ALGO}|\$ALGO/, coinInfo.algo.toLowerCase())
		.replace(/\${POOLSTRATUM}|\$POOLSTRATUM/, coinInfo.poolstratum1)
		.replace(/\${POOL}|\$POOL/, coinInfo.pool1)
		.replace(/\${PORT}|\$PORT/, coinInfo.port1)
		.replace(/\$ADDRESS|\${ADDRESS}/, coinInfo.address1)
		.replace(/\$WORKER|\${WORKER}/, coinInfo.worker1)
		.replace(/\$PASSWORD|\${PASSWORD}/, coinInfo.password1)
		.replace(/\${OPTS}|\$OPTS/, coinInfo.opts)
		.trim()
	minersJson["Miners"][coinInfo.miner]["EnvLoadPreload"] ? coinInfo["env"] = "env \"LD_PRELOAD=libcurl.so.3\" " : coinInfo["env"] = ""
	coinInfo.cuda !== "current" && coinInfo.cuda !== undefined ? coinInfo["cuda"] = "env \"LD_LIBRARY_PATH=libcudart.so.9.2\" " : coinInfo["cuda"] = ""
	coinInfo["finalCommand"] = coinInfo["env"] + coinInfo["cuda"] + coinInfo["path"] + " " + coinInfo["commandGenerated"]
	coinInfo["finalCommand"] = coinInfo["finalCommand"].trim()
	
	return coinInfo
}

	// Show the ui
function showUI(gpuType, coin, coinInfo, section) {
	if (section == "main") {
		if (gpuType == "NVIDIA") console.log(chalk.whiteBright('**********') + chalk.greenBright(' NVIDIA ') + chalk.whiteBright('**********'))
		if (gpuType == "AMD") console.log(chalk.whiteBright('************') + chalk.redBright(' AMD ') + chalk.whiteBright('***********'))
		if (gpuType == "CPU") console.log(chalk.whiteBright('************') + chalk.blueBright(' CPU ') + chalk.whiteBright('***********'))
		console.log(chalk.whiteBright('Coin : ') + chalk.yellowBright(coin))
		console.log(chalk.whiteBright('Algo : ') + chalk.yellowBright(coinInfo.algo))
		console.log(chalk.whiteBright('Miner : ') + chalk.yellowBright(coinInfo.miner))
		console.log(chalk.whiteBright('Command : ') + chalk.yellowBright(coinInfo.command))
		console.log(chalk.whiteBright('Generated Command : ') + chalk.yellowBright(coinInfo.finalCommand))
		if (gpuType == "NVIDIA") console.log(chalk.whiteBright('*******') + chalk.greenBright(' End of NVIDIA ') + chalk.whiteBright('*******'))
		if (gpuType == "AMD") console.log(chalk.whiteBright('*********') + chalk.redBright(' End of AMD ') + chalk.whiteBright('********'))
		if (gpuType == "CPU") console.log(chalk.whiteBright('*********') + chalk.blueBright(' End of CPU ') + chalk.whiteBright('********'))
	}
}

	// Run the command line
function run(coinInfo, gpuType, screen = '', screenRcm = '') {
	if (gpuType = "NVIDIA"){
		screen = "miner_nvidia"
		screenRcm = "/home/chosn/.screenrcm1"
	} else if (gpuType = "AMD") {
		screen = "miner_amd" 
		screenRcm = "/home/chosn/.screenrcm2"
	} else {
		screen = "miner_cpu"
		screenRcm = "/home/chosn/.screenrcm3"
	}
	return "screen -c " + screenRcm + " -dmSL " + screen + " " + coinInfo["finalCommand"]
}

	// Check if the screen as been created
function ifexist(gpuType, section) {
	screenName = gpuType == "NVIDIA" ? 'miner_nvidia' : gpuType == "AMD" ? 'miner_amd' : gpuType == "ethpill" ? 'ethpill' : 'miner_cpu'
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
