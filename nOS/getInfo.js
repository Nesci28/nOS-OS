module.exports = function(step, json = '') {
	// Dependancies
	const cp = require('child_process');
	const ip = require('ip');

	const nvidiaGPU = require('./helpers/gpu.js');
	const amdGPU = require('./helpers/amd_rocm_parser.js');
	const amdTweak = require('./helpers/amd_mem_tweak_parser.js');

	// Parsers
	const systemConfig = require('../SystemConfig.json');
	const coinsConfig = require('../CoinsConfig.json');
	const overclocksConfig = require('../Overclocks.json');

	// GPU Setup
	const setType = []
	const lspci = cp.execSync("lspci | grep VGA").toString().trim()
	if (/NVIDIA/.test(lspci)) setType[0] = "NVIDIA"
	if (/AMD/.test(lspci)) setType[1] = "AMD"
	setType[2] = "CPU"

	if (json == '') {
		var json = {
			"_id": null,
			"New Time": new Date().getTime(),
			"Old Time": null,
			"Runtime Start": new Date().getTime(),
			"Runtime": null,
			"Username": systemConfig["WebApp Username"],
			"Password": systemConfig["WebApp Password"],
			"Hostname" : systemConfig["Rig Hostname"],
			"IP": ip.address(),
			"Shellinabox": null,
			"Local GitHash": null,
			"Remote GitHash": null,
			"Nvidia": {
				"Coin": null,
				"Algo": null,
				"Total Hashrate": null,
				"Avg Temperature": null,
				"Coin Info": {},
				"GPU": {},
				"Miner Log": null
			},
			"Amd": {
				"Coin": null,
				"Algo": null,
				"Total Hashrate": null,
				"Avg Temperature": null,
				"Coin Info": {},
				"GPU": {},
				"Miner Log": null
			},
			"CPU": {
				"Coins": null,
				"Algo": null,
				"Total Hashrate": null,
				"Coin Info": {},
				"GPU": {},
				"Miner Log": null
			},
			"System Config": systemConfig,
			"Coins Config": coinsConfig,
			"Overclocks Config": overclocksConfig
		}
	}

	return main(step, json)

	// main
	async function main(step, json, counter) {
		json["Old Time"] = json["New Time"]
		json["New Time"] = new Date().getTime()
		json["Runtime"] = json["New Time"] - json["Runtime Start"]
		if (counter == 0 || counter == 480) {
			json["Local GitHash"] = cp.execSync('git rev-parse HEAD')
			json["Remote GitHash"] = cp.execSync('git ls-remote https://github.com/Nesci28/nOS.git | head -1 | cut -f1 -d$\'\t\'')
			if (json["Local GitHash"] !== json["Remote GitHash"]) {
				cp.execSync('nosFolder=$(find /home -type d -name nOS 2>/dev/null; cd ${nosFolder}; git stash && git pull origin master && git stash pop')
				console.log('Updated nOS to the latest Version.')
			} else {
				console.log('This version of nOS is currently the latest.')
			}
		}

		if (systemConfig["Nvidia Coin"] && setType[0]) {
			if (step == 'init') await getCoins('Nvidia')
			await getGPU('Nvidia')
			if (step !== 'stop') await getHashrate('Nvidia', json['Nvidia']['Coin Info']['miner'])
			json["Nvidia"]["Miner Log"] = await getMinerLog('Nvidia')
		}
		if (systemConfig["Amd Coin"] && setType[1]) {
			if (step == 'init') await getCoins('Amd')
			await getGPU('Amd')
			if (step !== 'stop') await getHashrate('Amd', json['Amd']['Coin Info']['miner'])
			json["Amd"]["Miner Log"] = await getMinerLog('Amd')
		}
		if (systemConfig["Cpu Coin"] && setType[2]) {
			if (step == 'init') await getCoins('Cpu')
			await getGPU('Cpu')
			if (step !== 'stop') await getHashrate('Cpu')
			json["Cpu"]["Miner Log"] = await getMinerLog('Cpu')
		}

		// console.log(json)
		return json
	}

	async function getCoins(brand) {
		json[brand]["Coin"] = systemConfig[brand + " Coin"]
		json[brand]["Algo"] = coinsConfig[brand][json[brand]["Coin"]]["Algo"]
		await getCoinInfo(json[brand]["Coin"], json[brand]["Algo"], brand)
	}

	async function getGPU(brand) {
		if (brand == "Nvidia") {
			json["Nvidia"]["GPU"] = []
			await nvidiaStats().then(val => {
				let stats = val.trim().split('\n')
				for (let [index, gpu] of stats.entries()) {		
					gpu = gpu.trim().split(', ')
					let gpuObject = clearVars()
					gpuObject["Utilization"] = gpu[0]
					gpuObject["Core Clock"] = gpu[1]
					gpuObject["Max Core"] = gpu[9]
					gpuObject["Mem Clock"] = gpu[2]
					gpuObject["Max Mem"] = gpu[10]
					gpuObject["Temperature"] = gpu[3]
					gpuObject["Watt"] = gpu[4]
					gpuObject["Min Watt"] = gpu[11]
					gpuObject["Max Watt"] = gpu[12]
					gpuObject["Fan Speed"] = gpu[5]
					gpuObject["Name"] = gpu[7]
					json["Nvidia"]["GPU"].push(gpuObject)
				}
			})
		}
				
		if (brand == "Amd") {
			json["Amd"]["GPU"] = []
			let amdRocm = cp.execSync('./helpers/ROC-smi/rocm-smi');
			let amdStats = amdGPU(amdRocm.toString())
			let amdMem = await amdTweak(cp.execSync('sudo ./helpers/amdmemtweak --current').toString())
			let amdName = cp.execSync('sudo ./helpers/amdmeminfo -q -s | cut -d \':\' -f3 | sed \'s/Radeon //g\'').toString().trim().split("\n")
			for (let i = 0; i < amdStats["gpus"].length; i++) {
				let gpuObject = clearVars()
				gpuObject["ID"] = amdStats["gpus"][i]["gpu"]
				gpuObject["Utilization"] = amdStats["gpus"][i]["utilization"]
				gpuObject["Core Clock"] = amdStats["gpus"][i]["sclock"]
				gpuObject["Mem Clock"] = amdStats["gpus"][i]["mclock"]
				gpuObject["Temperature"] = amdStats["gpus"][i]["temp"]
				gpuObject["Watt"] = amdStats["gpus"][i]["pwr"]
				gpuObject["Fan Speed"] = amdStats["gpus"][i]["fan"]
				gpuObject["Memory Timings"] = amdMem[i]
				gpuObject["Name"] = amdName[i]
				// gpuObject["Name"] = amdStats["gpus"][i][7]
				json["Amd"]["GPU"].push(gpuObject)
			}
		}
				
		let avgTemperature = 0
		for (let i = 0; i < json[brand]["GPU"].length; i++) {
			if (json[brand]["GPU"][i]["Temperature"] !== null) {
				avgTemperature += Number(json[brand]["GPU"][i]["Temperature"].toString().replace(/\D/g, ''))
			}
		}
		json[brand]["Avg Temperature"] = (avgTemperature / json[brand]["GPU"].length).toFixed(2) + " °C"
	}

	async function getHashrate(brand, miner) {
		let minerRunning = undefined
		try {
			minerRunning = cp.execSync('screen -ls | grep miner' + brand)
		} catch {}
		// run the getHashrate for that miner
		if (minerRunning) {
			let hashrate = require('../Miners/' + miner + '/getHashrate.js')
			hashrate = await hashrate()
			json[brand]["Total Hashrate"] = hashrate["Total Hashrate"]
			
			for (let i = 0; i < hashrate["Hashrate"].length; i++) {
				json[brand]["GPU"][i.toString()]["Hashrate"] = hashrate["Hashrate"][i]
			}
		}
	}

	async function nvidiaStats() {
		return await nvidiaGPU.getGPUStats()
	}

	function clearVars() {
			let gpuObject = {
			"ID": null,
			"Utilization": null,
			"Core Clock": null,
			"Max Core": null,
			"Mem Clock": null,
			"Max Mem": null,
			"Temperature": null,
			"Watt": null,
			"Min Watt": null,
			"Max Watt": null,
			"Fan Speed": null,
			"Name": null,
			"Hashrate": null,
			"Memory Timings": {}
		}

		return gpuObject
	}

	function getCoinInfo(coin, algo, gpuType) {
		json[gpuType]["Coin Info"]["opts"] = coinsConfig[gpuType][coin]["Options"]
		json[gpuType]["Coin Info"]["wallet"] = coinsConfig[gpuType][coin]["Wallet"]
		json[gpuType]["Coin Info"]["miner"] = coinsConfig[gpuType][coin]["Miner"]
		
		json[gpuType]["Coin Info"]["username1"] = coinsConfig[gpuType][coin]["Username"]
		json[gpuType]["Coin Info"]["worker1"] = coinsConfig[gpuType][coin]["Worker"]
		if (json[gpuType]["Coin Info"]["worker1"] && json[gpuType]["Coin Info"]["username1"]) json[gpuType]["Coin Info"]["account"] = json[gpuType]["Coin Info"]["username1"] + "." + json[gpuType]["Coin Info"]["worker1"]
		json[gpuType]["Coin Info"]["pool1"] = coinsConfig[gpuType][coin]["Pool"]
		json[gpuType]["Coin Info"]["port1"] = coinsConfig[gpuType][coin]["Port"]
		json[gpuType]["Coin Info"]["poolUri1"] = "stratum\+tcp:\/\/" + json[gpuType]["Coin Info"]["pool1"] + ":" + json[gpuType]["Coin Info"]["port1"]
		json[gpuType]["Coin Info"]["poolstratum1"] = json[gpuType]["Coin Info"]["pool1"] + ":" + json[gpuType]["Coin Info"]["port1"]
		json[gpuType]["Coin Info"]["password1"] = coinsConfig[gpuType][coin]["Password"]
		
		json[gpuType]["Coin Info"]["username2"] = coinsConfig[gpuType][coin]["Alternative Username"]
		json[gpuType]["Coin Info"]["worker2"] = coinsConfig[gpuType][coin]["Alternative Worker"]
		if (json[gpuType]["Coin Info"]["worker2"] && json[gpuType]["Coin Info"]["username2"]) json[gpuType]["Coin Info"]["account2"] = json[gpuType]["Coin Info"]["username2"] + "." + json[gpuType]["Coin Info"]["worker2"]
		json[gpuType]["Coin Info"]["pool2"] = coinsConfig[gpuType][coin]["Alternative Pool"]
		json[gpuType]["Coin Info"]["port2"] = coinsConfig[gpuType][coin]["Alternative Port"]
		json[gpuType]["Coin Info"]["poolUri2"] = "stratum\+tcp:\/\/" + json[gpuType]["Coin Info"]["pool2"] + ":" + json[gpuType]["Coin Info"]["port2"]
		json[gpuType]["Coin Info"]["poolstratum2"] = json[gpuType]["Coin Info"]["pool2"] + ":" + json[gpuType]["Coin Info"]["port2"]
		json[gpuType]["Coin Info"]["password2"] = coinsConfig[gpuType][coin]["Alternative Password"]
	}

	async function getMinerLog() {
		try {
			let tmux = await cp.execSync('tmux has-sessions -t miners 2>/dev/null; echo $?').toString().trim()
			if (tmux == 0) return cp.execSync('tmux capture-pane -pS 40').toString()
		} catch {}
	}
}