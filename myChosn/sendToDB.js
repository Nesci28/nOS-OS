// dependencies
const info = require('./getInfo.js')
const monk = require('monk')

// DB setup
const db = monk('nesci:012Webserver@ds153495.mlab.com:53495/webserver');
const webserver = db.get('rigsInfo')

// functions
  // push infos to the DB
async function pushToDB() {
	let json = await info.info.v

	let existingDB = await webserver.find({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]})
	checkForNewConfigs(existingDB)

	await setID(existingDB)

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

pushToDB()
setInterval(pushToDB(), 10000)

function checkForNewConfigs(existingDB) {
	let systemSerial = existingDB["System Config"].Serial
	if (systemSerial > json["System Config"].Serial) {
		copy('SystemConfig.json', existingDB["System Config"])
	}
	let coinsSerial = existingDB["Coins Config"].Serial
	if (coinsSerial > json["Coins Config"].Serial) {
		copy('CoinsConfig.json', existingDB["Coins Config"])
	}
	let overclocksSerial = existingDB["Overclocks Config"].Serial
	if (overclocksSerial > json["Overclocks Config"].Serial) {
		copy('Overclocks.json', existingDB["Overclocks Config"])
	}

	function copy(config, newValues) {
		fs.writeFileSync('../' + config, newValues)
	}
}

function setID(existingDB) {
	if (existingDB == undefined) {
		console.log("New rig detected, creating a new entry in the DB.")
		json["_id"] = monk.id()
	} else {
		console.log("Updated the DB with the newest values.")
		json['_id'] = existingDB[0]["_id"]
	}
	json["Old Time"] = json["New Time"]
	json["New Time"] = new Date().getTime()
}

  // push grafana informations to the DB
async function pushToGrafana() {
	// futur function to add the hashrate, power consumption and temperature to the db
}