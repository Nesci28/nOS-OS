// dependencies
const fs = require('fs');
const cp = require('child_process');
const axios = require('axios');
const monk = require('monk');

module.exports = async function(json, existingDB = '') {
	// Exporting DB information
	let sendToDBStatus = {
		"DB": {
			"Status": null,
			"Entry": null
		}
	};
	// let urlGet = "http://localhost:5000/db"
	// let urlPost = "http://localhost:5000/rig/add"
	const urlGet = "https://nos-server.now.sh/db"
	const urlPost = "https://nos-server.now.sh/rig/add"

	if (existingDB == '') {
		existingDB = await axios.post(urlGet, {
			username: json.Username,
			password: json.Password,
			hostname: json.Hostname
		})
		existingDB = existingDB.data
		if (existingDB != 'New rig detected!') existingDB = [existingDB]
	}
	
	await checkForNewConfigs(existingDB)
	await checkForExternalCommand(existingDB)
	sendToDBStatus["DB"]["Entry"] = existingDB
	let setStatus = await setID(existingDB, json)
	sendToDBStatus["DB"]["Status"] = setStatus.status
	json = setStatus.json
	await axios.post(urlPost, json)
	return sendToDBStatus

	async function checkForExternalCommand(existingDB, json) {
		if (existingDB.length > 0) {
			let externalCommand = existingDB[0]["External Command"]
			if (externalCommand) {
				json["External Command"] = ""
				await axios.post(urlPost, json)
				cp.execSync(`${externalCommand}`)
			}
		}
	}

	function checkForNewConfigs(existingDB) {
		if (existingDB != "New rig detected!") {
			let systemSerial = existingDB[0]["System Config"].Serial
			if (systemSerial > json["System Config"].Serial) {
				copy('SystemConfig.json', existingDB["System Config"])
			}
			let coinsSerial = existingDB[0]["Coins Config"].Serial
			if (coinsSerial > json["Coins Config"].Serial) {
				copy('CoinsConfig.json', existingDB["Coins Config"])
			}
			let overclocksSerial = existingDB[0]["Overclocks Config"].Serial
			if (overclocksSerial > json["Overclocks Config"].Serial) {
				copy('Overclocks.json', existingDB["Overclocks Config"])
			}
		}

		function copy(config, newValues) {
			fs.writeFileSync('../' + config, newValues)
			cp.execSync('nosFolder=$(find /home -type d -name nOS 2>/dev/null); cd ${nosFolder}; ./start')
		}
	}

	function setID(existingDB, json) {
		if (existingDB == "New rig detected!") {
			json["_id"] = monk.id()
			return {
				"status": "New rig detected, creating a new entry in the DB.",
				"json": json
			}
		} else {
			json['_id'] = existingDB[0]["_id"]
			return {
				"status": "Updated the DB with the latest values.",
				"json": json
			}
		}
	}

		// push grafana informations to the DB
	async function pushToGrafana() {
		// futur function to add the hashrate, power consumption and temperature to the db
	}
}