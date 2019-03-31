// dependencies
const fs = require('fs');
const monk = require('monk');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('012idontreallygiveashit012');

// DB setup
let dotenv = fs.readFileSync('../nOS/helpers/.dotenv').toString()
dotenv = JSON.parse(cryptr.decrypt(dotenv));

const db = monk(`${dotenv.User}:${dotenv.Pass}@${dotenv.Host}`);
const webserver = db.get('rigsInfo');

const link = process.argv[process.argv.length - 2];
const md5hash = process.argv[process.argv.length - 1];

(async() => {
	existingDB = await webserver.findOne({"download": /(.)/, "md5": /(.)/})
	if (existingDB) {
		await webserver.update(existingDB, {"download": link, "md5": md5hash}, [{"castIds": false}])
	} else {
		await webserver.insert({"download": link, "md5": md5hash})
			.then((docs) => {
				console.log(docs)
			}).catch((err) => {
				console.log(err);
			})
	}
	process.exit()
})()