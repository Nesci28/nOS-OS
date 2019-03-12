// dependencies
const info = require('./getInfo.js')
const monk = require('monk')

// DB setup
const db = monk('nesci:012Webserver@ds153495.mlab.com:53495/webserver');
const webserver = db.get('rigsInfo')

// Exporting DB information
let sendToDBStatus = {
  "Status": null
};
module.exports = sendToDBStatus;

// functions
  // push infos to the DB
async function pushToDB(json) {
	let existingDB = await webserver.find({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]})
	checkForNewConfigs(existingDB)
	sendToDBStatus["Status"] = await setID(existingDB, json).status
	json = await setID(existingDB, json).json
	console.log(sendToDBStatus["Status"]);
	
	console.log(json)

	if (existingDB.length > 0) {
		webserver.update({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]}, json, [{"castIds": false}])
	} else {
		webserver.insert(json, [{"castIds": false}])
			.then((docs) => {
			}).catch((err) => {
				console.log(err);
			})
	}
}

(async() => {
  let json = await info
  await pushToDB(json)
})()
setInterval(async () => {
  let json = await info
  await pushToDB(json)
}, 11000)

function checkForNewConfigs(existingDB) {
	console.log(existingDB)
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