// dependencies
const fs = require("fs");
const cp = require("child_process");
const axios = require("axios");
const monk = require("monk");

module.exports = async function(json, existingDB = "") {
  // Exporting DB information
  let sendToDBStatus = {
    DB: {
      Status: null,
      Entry: null
    }
  };
  // let urlGet = "http://localhost:5000/db"
  // let urlPost = "http://localhost:5000/rig/add"
  const urlGet = "https://nos-server.now.sh/db";
  const urlPost = "https://nos-server.now.sh/rig/add";
  const urlPostAlternative = "https://node-nos.herokuapp.com/api/v2/rig/add";

  if (existingDB == "") {
    existingDB = await axios.post(urlGet, {
      username: json.Username,
      password: json.Password,
      hostname: json.Hostname
    });
    existingDB = existingDB.data;
    if (existingDB != "New rig detected!") existingDB = [existingDB];
  }

  await checkForNewConfigs(existingDB, json);
  await checkForExternalCommand(existingDB, json);
  sendToDBStatus["DB"]["Entry"] = existingDB;
  let setStatus = await setID(existingDB, json);
  sendToDBStatus["DB"]["Status"] = setStatus.status;
  json = setStatus.json;
  try {
    await axios.post(urlPost, json);
  } catch {
    await axios.post(urlPostAlternative, json);
  } finally {
    return sendToDBStatus;
  }

  async function checkForExternalCommand(existingDB, json) {
    if (existingDB.length > 0) {
      let externalCommand = existingDB[0]["External Command"];
      if (externalCommand) {
        json["External Command"] = "";
        try {
          await axios.post(urlPost, json);
        } catch {
          await axios.post(urlPostAlternative, json);
        } finally {
          cp.execSync(`${externalCommand}`);
        }
      }
    }
  }

  function checkForNewConfigs(existingDB, json) {
    if (existingDB != "New rig detected!") {
      let systemSerial = existingDB[0]["System Config"].Serial;
      if (systemSerial > json["System Config"].Serial) {
        copy("SystemConfig.json", existingDB[0]["System Config"]);
      }
      let coinsSerial = existingDB[0]["Coins Config"].Serial;
      if (coinsSerial > json["Coins Config"].Serial) {
        copy("CoinsConfig.json", existingDB[0]["Coins Config"]);
      }
      let overclocksSerial = existingDB[0]["Overclocks Config"].Serial;
      if (overclocksSerial > json["Overclocks Config"].Serial) {
        copy("Overclocks.json", existingDB[0]["Overclocks Config"]);
      }
    }

    function copy(config, newValues) {
      fs.writeFileSync("../" + config, JSON.stringify(newValues, undefined, 4));
      let cd = cp
        .execSync("find /home -type d -name nOS 2>/dev/null")
        .toString();
      cp.exec(`./${cd}/start.sh`);
      process.exit();
    }
  }

  function setID(existingDB, json) {
    if (existingDB == "New rig detected!") {
      json["_id"] = monk.id();
      return {
        status: "New rig detected, creating a new entry in the DB.",
        json: json
      };
    } else {
      json["_id"] = existingDB[0]["_id"];
      return {
        status: "Updated the DB with the latest values.",
        json: json
      };
    }
  }

  // push grafana informations to the DB
  async function pushToGrafana() {
    // futur function to add the hashrate, power consumption and temperature to the db
  }
};
