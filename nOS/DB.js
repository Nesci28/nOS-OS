// dependencies
const fs = require('fs');
const monk = require('monk');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('012idontreallygiveashit012');


// DB setup
let dotenv = fs.readFileSync('./helpers/.dotenv').toString()
dotenv = JSON.parse(cryptr.decrypt(dotenv));

const db = monk(`${dotenv.User}:${dotenv.Pass}@${dotenv.Host}`)
const webserver = db.get('rigsInfo')

module.exports = async function(json, existingDB = '') {
	// Exporting DB information
	let sendToDBStatus = {
		"DB": {
			"Status": null,
			"Entry": null
		}
	};


	if (existingDB == '') {
		existingDB = await webserver.find({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]})
	}
	checkForNewConfigs(existingDB)
	sendToDBStatus["DB"]["Entry"] = existingDB
	sendToDBStatus["DB"]["Status"] = await setID(existingDB, json).status
	json = await setID(existingDB, json).json
	
	if (existingDB.length > 0) {
		webserver.update({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]}, json, [{"castIds": false}])
	} else {
		webserver.insert(json, [{"castIds": false}])
			.then((docs) => {
			}).catch((err) => {
				console.log(err);
			})
	}
	return sendToDBStatus

	function checkForNewConfigs(existingDB) {
		if (existingDB.length > 0) {
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
		}
	}

	function setID(existingDB, json) {
		json["Old Time"] = json["New Time"]
		json["New Time"] = new Date().getTime()
		if (existingDB.length == 0) {
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