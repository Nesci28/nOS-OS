module.exports = async function(step) {
  // Dependancies
  const ngrok = require("ngrok");
  const cp = require("child_process");

  const systemConfigs = require("../SystemConfig.json");

  const shellinabox = {
    Ngrok: {
      URL: null
    },
    Localtunnel: {
      URL: null
    }
  };
  if (systemConfigs.Shellinabox) {
    if (step == "init") {
      try {
        var shellIsRunning = cp.execSync('ps aux | grep "[s]hellinaboxd"');
      } catch {
        var shellIsRunning = false;
      }

      if (!shellIsRunning) cp.exec("shellinaboxd &");

      shellinabox.Ngrok.URL = await ngrok.connect(4200);
      let ls = cp.spawn("lt", ["--port", "4200", "&"]);
      return new Promise(function(resolve, reject) {
        ls.stdout.on("data", async function(data) {
          shellinabox.Localtunnel.URL = await data
            .toString()
            .split(" ")[3]
            .replace("\n", "");
          resolve(shellinabox);
        });
      });
    }

    if (step == "ngrok" || step == "stop") {
      await ngrok.disconnect();
      await ngrok.kill();
      shellinabox.Ngrok.URL = "Stopped";
      shellinabox.Localtunnel.URL = "Stopped";
    }
  }
  return shellinabox;
};
