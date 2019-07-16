module.exports = async function(step, shellinabox = "") {
  // Dependancies
  const cp = require("child_process");
  const ps = require("ps-node");

  const systemConfigs = require("../SystemConfig.json");

  if (step == "reset") {
    try {
      await kill([shellinabox.Localtunnel.PID, shellinabox.Serveo.PID], ps);
    } catch {
      console.log("reset - error");
    }
  }

  if (shellinabox == "" || step == "reset") {
    shellinabox = {
      Localtunnel: {
        URL: null,
        PID: null
      },
      Serveo: {
        URL: null,
        PID: null
      }
    };
  }

  if (step == "init" || step == "reset") {
    shellinabox = await createTunnels(step, systemConfigs, cp, shellinabox);
  }

  if (step == "stop") {
    try {
      await kill([shellinabox.Localtunnel.PID, shellinabox.Serveo.PID], ps);
    } catch {
      console.log("stop - error");
    }
    shellinabox.Localtunnel.URL = "Stopped";
    shellinabox.Serveo.URL = "Stopped";
  }

  return shellinabox;
};

function kill(pids, ps) {
  for (let pid of pids) {
    if (typeof pid == "number") {
      ps.kill(pid, function(err) {
        if (err) {
          console.log(err);
        }
      });
    }
  }
}

async function createTunnels(step, systemConfigs, cp, shellinabox) {
  if (systemConfigs.Shellinabox) {
    if (step == "init" || step == "reset") {
      if (step == "init") {
        try {
          var shellIsRunning = cp.execSync('ps aux | grep "[s]hellinaboxd"');
        } catch {
          var shellIsRunning = false;
        }
        if (!shellIsRunning) cp.exec("shellinaboxd &");
      }

      let localtunnel = cp.spawn("lt", ["--port", "4200"]);
      shellinabox.Localtunnel.PID = localtunnel.pid;
      new Promise(function(resolve, reject) {
        localtunnel.stdout.on("data", async function(data) {
          if (shellinabox.Localtunnel.URL == null) {
            shellinabox.Localtunnel.URL = await data
              .toString()
              .split(" ")[3]
              .replace("\n", "");
            resolve(shellinabox);
          }
        });
      });

      let serveo = cp.spawn("ssh", ["-R", "80:localhost:4200", "serveo.net"]);
      shellinabox.Serveo.PID = serveo.pid;
      new Promise(function(resolve, reject) {
        serveo.stdout.on("data", async function(data) {
          if (shellinabox.Serveo.URL == null) {
            shellinabox.Serveo.URL = await data
              .toString()
              .split(" ")[4]
              .replace(
                /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
                ""
              )
              .replace("\r", "")
              .replace("\n", "");
            resolve(shellinabox);
          }
        });
      });
    }
  }

  return shellinabox;
}
