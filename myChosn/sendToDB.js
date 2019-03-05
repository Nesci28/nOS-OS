// dependencies
const infos = require('getInfo.js')
const monk = require('monk')

// DB setup
const db = monk('nesci:012Webserver@ds153495.mlab.com:53495/webserver');
const webserver = db.get('rigsInfo')

// functions
  // push infos to the DB
async function pushToDB(infos) {
	let test = await webserver.find({"Username": json["Username"], "Password": json["Password"], "Hostname": json["Hostname"]})
	await setID(test)
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

pushToDB(infos)
setInterval(pushToDB(infos), 10000);

function setID(test) {
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

  // push grafana informations to the DB
async function pushToGrafana() {
	// futur function to add the hashrate, power consumption and temperature to the db
}