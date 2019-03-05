// Dependancies
const parser = require('parse-ini')
const fetch = require('node-fetch')
const cp = require('child_process')
const monk = require('monk')

const CoinsMiners = require('./coins_miners.js')
const nvidiaGPU = require('./gpu.js')
const amdGPU = require('./amd_rocm_parser.js')

// Parsers
const systemConfig = parser.parse('../System_Config')
const coinsConfig = parser.parse('../Coins_Config')
const minersJson = CoinsMiners.read()

// GPU Setup
const setType = []
const lspci = cp.execSync("lspci | grep VGA").toString().trim()
if (/NVIDIA/.test(lspci)) setType[0] = "NVIDIA"
if (/AMD/.test(lspci)) setType[1] = "AMD"
setType[2] = "CPU"

// DB setup
const db = monk('nesci:012Webserver@ds153495.mlab.com:53495/webserver');
const webserver = db.get('rigsInfo')

// Seting up the object
const json = {
	"_id": null,
	"New Time": new Date().getTime(),
	"Old Time": null,
	"Username": systemConfig.USERNAME_ALT.match("\"(.*)\"")[1],
	"Password": systemConfig.PASSWORD.match("\"(.*)\"")[1],
	"Hostname" : systemConfig.RIGNAME.match("\"(.*)\"")[1],
	"Nvidia": {
		"Coin": null,
		"Algo": null,
		"Total Hashrate": null,
		"Avg Temperature": null,
		"Total Watt": null,
		"Coin Info": {},
		"GPU": []
	},
	"Amd": {
		"Coin": null,
		"Algo": null,
		"Total Hashrate": null,
		"Avg Temperature": null,
		"Total Watt": null,
		"Coin Info": {},
		"GPU": {}
	},
	"CPU": {
		"Coins": null,
		"Algo": null,
		"Total Hashrate": null,
		"Coin Info": {},
		"GPU": {}
	}
}

async function pushToDB() {
	let test = await webserver.find({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]})
	if (test.length > 0) {
		webserver.update({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]}, await getInfo(test), [{"castIds": false}])
	} else {
		webserver.insert(await getInfo(), [{"castIds": false}])
			.then((docs) => {
			}).catch((err) => {
				console.log(err);
			})
	}
}

pushToDB()
setInterval(pushToDB, 10000);




async function pushToGrafana() {
	// future funciton to add the hashrate, power consumption and temperature to the db
}


async function getInfo(test) {
	await getCoins()
	await getGPU()
	if (systemConfig.COIN_NVIDIA.match("\"(.*)\"")[1] && setType[0]) await getHashrate('Nvidia')
	if (systemConfig.COIN_AMD.match("\"(.*)\"")[1] && setType[1]) await getHashrate('Amd')
	await setID(test)
	return json
}

async function setID(test) {
	if (test == undefined) {
		console.log("New rig detected, creating a new entry in the DB.")
		json["_id"] = monk.id()
	} else {
		console.log("Updated the DB with the newest values.")
		json['_id'] = test[0]["_id"]
	}
	json["Old Time"] = json["New Time"]
	json["New Time"] = new Date().getTime()
}

async function getCoins() {
	// Coins and Algos
	if (systemConfig.COIN_NVIDIA.match("\"(.*)\"")[1] && setType[0]) {
		json["Nvidia"]["Coin"] = systemConfig.COIN_NVIDIA.match("\"(.*)\"")[1]
		json["Nvidia"]["Algo"] = eval("coinsConfig." + json["Nvidia"]["Coin"] + "_ALGO").match("\"(.*)\"")[1]
		json["Nvidia"]["Coin Info"] = getCoinInfo(json["Nvidia"]["Coin"], json["Nvidia"]["Algo"], "Nvidia", "_PREM")
	}
	if (systemConfig.COIN_AMD.match("\"(.*)\"")[1] && setType[1]) {
		json["Amd"]["Coin"] = systemConfig.COIN_AMD.match("\"(.*)\"")[1]
		json["Amd"]["Algo"] = eval("coinsConfig." + json["Amd"]["Coin"] + "_ALGO").match("\"(.*)\"")[1]
		json["Amd"]["Coin Info"] = getCoinInfo(json["Amd"]["Coin"], json["Amd"]["Algo"], "Amd", "_PREM")
	}
	if (systemConfig.COIN_CPU.match("\"(.*)\"")[1] && setType[2]) {
		json["CPU"]["Coin"] = systemConfig.COIN_CPU.match("\"(.*)\"")[1]
		json["CPU"]["Algo"] = eval("coinsConfig." + json["CPU"]["Coin"] + "_ALGO").match("\"(.*)\"")[1]
		json["CPU"]["Coin Info"] = getCoinInfo(json["CPU"]["Coin"], json["CPU"]["Algo"], "CPU", "_PREM")
	}
}

async function getGPU() {
	// GPU Infos
	if (systemConfig.COIN_NVIDIA.match("\"(.*)\"")[1] && setType[0]) {
		json["Nvidia"]["GPU"] = []
		await nvidiaStats().then(val => {
			let stats = val.trim().split('\n')
			for (let [index, gpu] of stats.entries()) {		
				gpu = gpu.trim().split(', ')
				let gpuObject = {
					"Utilization": null,
					"Core Clock": null,
					"Mem Clock": null,
					"Temperature": null,
					"Watt": null,
					"Fan Speed": null,
					"Name": null,
					"Hashrate": null
				}
				gpuObject["Utilization"] = gpu[0]
				gpuObject["Core Clock"] = gpu[1]
				gpuObject["Mem Clock"] = gpu[2]
				gpuObject["Temperature"] = gpu[3]
				gpuObject["Watt"] = gpu[4].split(' ')[0]
				gpuObject["Fan Speed"] = gpu[5]
				gpuObject["Name"] = gpu[7]	
				json["Nvidia"]["GPU"].push(gpuObject)
			}

			let avgTemperature = 0
			let totalWatt = 0
			for (let i = 0; i < json["Nvidia"]["GPU"].length; i++) {
				avgTemperature += json["Nvidia"]["GPU"][i]["Temperature"]
				totalWatt += json["Nvidia"]["GPU"][i]["Watt"]
			}
			json["Nvidia"]["Avg Temperature"] = (avgTemperature / json["Nvidia"]["GPU"].length).toFixed(2) + " °C"
			json["Nvidia"]["Total Watt"] = Number(totalWatt).toFixed(2)
		})
	}

	if (systemConfig.COIN_AMD.match("\"(.*)\"")[1] && setType[1]) {
    json["Amd"]["GPU"] = []
    let amdRocm = await cp.execSync('/opt/ROC-smi/rocm-smi');
    let amdStats = amdGPU(amdRocm.toString())

    for (let i = 0; i < amdStats["gpus"].length; i++) {
    	let gpuObject = {
				"Utilization": null,
				"Core Clock": null,
				"Mem Clock": null,
				"Temperature": null,
				"Watt": null,
				"Fan Speed": null,
				"Name": null,
				"Hashrate": null
			}
			gpuObject["Utilization"] = amdStats["gpus"][i]["perf"]
			gpuObject["Core Clock"] = amdStats["gpus"][i]["sclock"]
			gpuObject["Mem Clock"] = amdStats["gpus"][i]["mclock"]
			gpuObject["Temperature"] = amdStats["gpus"][i]["temp"]
			gpuObject["Watt"] = amdStats["gpus"][i]["pwr"]
			gpuObject["Fan Speed"] = amdStats["gpus"][i]["fan"]
			gpuObject["Name"] = amdStats["gpus"][i][7]	
			json["Amd"]["GPU"].push(gpuObject)
    }

		let avgTemperature = 0
		let totalWatt = 0
		for (let i = 0; i < json["Amd"]["GPU"].length; i++) {
			avgTemperature += json["Amd"]["GPU"][i]["Temperature"]
			totalWatt += json["Amd"]["GPU"][i]["Watt"]
		}
		json["Amd"]["Avg Temperature"] = (avgTemperature / json["Amd"]["GPU"].length).toFixed(2) + " °C"
		json["Amd"]["Total Watt"] = +totalWatt.toFixed(2)
	}
}

async function getHashrate(gpuType) {
	if (json[gpuType]["Coin Info"]["miner"].match(/TREX/)) {
		let minerRes = cp.execSync('echo "summary" | netcat localhost 4200')
		minerRes = JSON.parse(minerRes.toString())
		json[gpuType]["Total Hashrate"] = (minerRes["hashrate"] / 1000000).toFixed(2) + " MH/s"

		for (let x = 0; x < minerRes["gpus"].length; x++) {
			json[gpuType]["GPU"][x.toString()]["Hashrate"] = (minerRes["gpus"][x]["hashrate"] / 1000000).toFixed(2) + " MH/s"
		}	
	}

	if (json[gpuType]["Coin Info"]["miner"].match(/WILDRIG/)) {
		let minerRes = await fetch('http://localhost:3334')
			.then(response => response.json())

		json[gpuType]["Total Hashrate"] = (minerRes["hashrate"]["total"][0] / 1000000).toFixed(2) + " MH/s"

		for (let x = 0; x < minerRes["hashrate"]["threads"].length; x++) {
			json[gpuType]["GPU"][x.toString()]["Hashrate"] = (minerRes["hashrate"]["threads"][x.toString()][0] / 1000000).toFixed(2) + " MH/s"
		}		
	}
}

// async function postData(url = ``, data = {}) {
//   return await fetch(url, {
//     method: "POST",
//     mode: "cors",
//     cache: "no-cache",
//     credentials: "same-origin",
//     headers: {
//         "Content-Type": "application/json",
//     },
//     redirect: "follow",
//     referrer: "no-referrer",
//     body: JSON.stringify(data),
//   })
//   .then(response => response.json())
// }

async function nvidiaStats() {
  return await nvidiaGPU.getGPUStats()
}

function getCoinInfo(coin, algo, gpuType, version) {
	json[gpuType]["Coin Info"]["opts"] = eval("coinsConfig." + coin + "_" + algo + "_OPTS").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["worker1"] = eval("coinsConfig." + coin + "_" + algo + "_WORKER").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["address1"] = eval("coinsConfig." + coin + "_" + algo + "_ADDRESS").match("\"(.*)\"")[1]
	if (json[gpuType]["Coin Info"]["worker1"] && json[gpuType]["Coin Info"]["address1"]) json[gpuType]["Coin Info"]["address1"] = json[gpuType]["Coin Info"]["address1"] + "." + json[gpuType]["Coin Info"]["worker1"]
	json[gpuType]["Coin Info"]["poolUri1"] = eval("coinsConfig." + coin + "_" + algo + "_POOL_URI").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["pool1"] = eval("coinsConfig." + coin + "_" + algo + "_POOL").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["port1"] = eval("coinsConfig." + coin + "_" + algo + "_PORT").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["poolstratum1"] = json[gpuType]["Coin Info"].pool1 + ":" + json[gpuType]["Coin Info"].port1
	json[gpuType]["Coin Info"]["password1"] = eval("coinsConfig." + coin + "_" + algo + "_PASSWORD").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["worker2"] = eval("coinsConfig." + coin + "_" + algo + "_WORKER2").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["address2"] = eval("coinsConfig." + coin + "_" + algo + "_ADDRESS2").match("\"(.*)\"")[1]
	if (json[gpuType]["Coin Info"]["worker2"] && json[gpuType]["Coin Info"]["address2"]) json[gpuType]["Coin Info"]["address2"] = json[gpuType]["Coin Info"]["address2"] + "." + json[gpuType]["Coin Info"]["worker2"]
	json[gpuType]["Coin Info"]["poolUri2"] = eval("coinsConfig." + coin + "_" + algo + "_POOL_URI2").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["pool2"] = eval("coinsConfig." + coin + "_" + algo + "_POOL2").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["port2"] = eval("coinsConfig." + coin + "_" + algo + "_PORT2").match("\"(.*)\"")[1]
	json[gpuType]["Coin Info"]["poolstratum2"] = json[gpuType]["Coin Info"].pool2 + ":" + json[gpuType]["Coin Info"].port2
	json[gpuType]["Coin Info"]["password2"] = eval("coinsConfig." + coin + "_" + algo + "_PASSWORD2").match("\"(.*)\"")[1]

	// Getting the miner information for Nvidia and Amd
	if (gpuType !== "CPU") {
		json[gpuType]["Coin Info"]["miner"] = minersJson["User"][algo][gpuType.toUpperCase() + version]
		json[gpuType]["Coin Info"]["path"] = minersJson["Miners"][json[gpuType]["Coin Info"].miner]["Path"]
		json[gpuType]["Coin Info"]["command"] = minersJson["Miners"][json[gpuType]["Coin Info"].miner]["Command"]
	}

	// Getting the miner information for CPU
	if (gpuType == "CPU") { 
		json[gpuType]["Coin Info"]["miner"] = minersJson["CPU"]["User"]["Name"]
		json[gpuType]["Coin Info"]["path"] = minersJson["CPU"]["User"]["Path"]
		json[gpuType]["Coin Info"]["command"] = minersJson["CPU"]["User"]["Command"]
	}

	// Generating the stuff to launch the miner
	json[gpuType]["Coin Info"]["commandGenerated"] = json[gpuType]["Coin Info"]["command"]
		.replace(/\${ALGO,,}|\${ALGO}|\$ALGO/, algo.toLowerCase())
		.replace(/\${POOLSTRATUM}|\$POOLSTRATUM/, json[gpuType]["Coin Info"].poolstratum1)
		.replace(/\${POOL}|\$POOL/, json[gpuType]["Coin Info"].pool1)
		.replace(/\${PORT}|\$PORT/, json[gpuType]["Coin Info"].port1)
		.replace(/\$ADDRESS|\${ADDRESS}/, json[gpuType]["Coin Info"].address1)
		.replace(/\$WORKER|\${WORKER}/, json[gpuType]["Coin Info"].worker1)
		.replace(/\$PASSWORD|\${PASSWORD}/, json[gpuType]["Coin Info"].password1)
		.replace(/\${OPTS}|\$OPTS/, json[gpuType]["Coin Info"].opts)
		.trim()
	minersJson["Miners"][json[gpuType]["Coin Info"].miner]["EnvLoadPreload"] ? json[gpuType]["Coin Info"]["env"] = "env \"LD_PRELOAD=libcurl.so.3\" " : json[gpuType]["Coin Info"]["env"] = ""
	json[gpuType]["Coin Info"].cuda !== "current" && json[gpuType]["Coin Info"].cuda !== undefined ? json[gpuType]["Coin Info"]["cuda"] = "env \"LD_LIBRARY_PATH=libcudart.so.9.2\" " : json[gpuType]["Coin Info"]["cuda"] = ""
	json[gpuType]["Coin Info"]["finalCommand"] = json[gpuType]["Coin Info"]["env"] + json[gpuType]["Coin Info"]["cuda"] + json[gpuType]["Coin Info"]["path"] + " " + json[gpuType]["Coin Info"]["commandGenerated"]
	json[gpuType]["Coin Info"]["finalCommand"] = json[gpuType]["Coin Info"]["finalCommand"].trim()

	return json[gpuType]["Coin Info"]
}
