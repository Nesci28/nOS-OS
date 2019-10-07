// dependencies
const fs = require("fs");
const cp = require("child_process");
const axios = require("axios");
const monk = require("monk");

const restart = require("./restart");

module.exports = async function(json, existingDB = "") {
  // Exporting DB information
  let sendToDBStatus = {
    DB: {
      Status: null,
      Entry: null,
    },
  };
  // let urlGet = "http://localhost:5000/db"
  // let urlPost = "http://localhost:5000/rig/add"
  // const urlGet = "https://node-nos.herokuapp.com/api/v2/db";
  const urlGet = "https://node-nos.herokuapp.com/api/v2/db";
  const urlPostAlternative = "https://nos-server.now.sh/rig/add";
  const urlPost = "https://node-nos.herokuapp.com/api/v2/rig/add";

  if (existingDB == "") {
    existingDB = await axios.post(urlGet, {
      username: json.Username,
      password: json.Password,
      hostname: json.Hostname,
    });
    existingDB = existingDB.data;
    if (existingDB != "New rig detected!") existingDB = [existingDB];
  }

  let entries = await axios.get(urlGet, {
    params: {
      username: json.Username,
      password: json.Password,
      hostname: json.Hostname,
    },
  });
  entries = entries.data;
  await checkForNewConfigs(entries, json);
  await checkForExternalCommand(entries, json);
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
    if (existingDB != "New rig detected!") {
      let externalCommand = existingDB["External Command"];
      if (externalCommand) {
        json["External Command"] = "";
        try {
          await axios.post(urlPost, json);
        } catch {
          await axios.post(urlPostAlternative, json);
        } finally {
          if (externalCommand === "restart") {
            restart();
          } else {
            cp.exec(`${externalCommand}`);
          }
        }
      }
    }
  }

  function checkForNewConfigs(existingDB, json) {
    if (existingDB != "New rig detected!") {
      try {
        let systemSerial = existingDB["System Config"].Serial;
        if (systemSerial > json["System Config"].Serial) {
          copy("SystemConfig.json", existingDB["System Config"]);
        }
        let coinsSerial = existingDB["Coins Config"].Serial;
        if (coinsSerial > json["Coins Config"].Serial) {
          copy("CoinsConfig.json", existingDB["Coins Config"]);
        }
        let overclocksSerial = existingDB["Overclocks Config"].Serial;
        if (overclocksSerial > json["Overclocks Config"].Serial) {
          copy("Overclocks.json", existingDB["Overclocks Config"]);
        }
      } catch {}
    }

    function copy(config, newValues) {
      fs.writeFileSync("../" + config, JSON.stringify(newValues, undefined, 4));
      let cd = cp
        .execSync("find /home -type d -name nOS 2>/dev/null")
        .toString();
      const start = cp.spawn(`./${cd}/start.sh`);
      start.stdout.on("data", function(data) {
        console.log(data.toString());
      });
      process.exit();
    }
  }

  function setID(existingDB, json) {
    if (existingDB == "New rig detected!") {
      json["_id"] = monk.id();
      return {
        status: "New rig detected, creating a new entry in the DB.",
        json: json,
      };
    } else {
      json["_id"] = existingDB[0]["_id"];
      return {
        status: "Updated the DB with the latest values.",
        json: json,
      };
    }
  }

  // push grafana informations to the DB
  async function pushToGrafana() {
    // futur function to add the hashrate, power consumption and temperature to the db
  }
};
