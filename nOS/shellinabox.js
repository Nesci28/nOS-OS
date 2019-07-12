module.exports = async function(step) {
  // Dependancies
  const ngrok = require("ngrok");
  const localtunnel = require("localtunnel");
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
    }

    if (step == "shellinabox" || step == "stop") {
      await ngrok.disconnect();
      await ngrok.kill();
      shellinabox.Ngrok.URL = "Stopped";
      shellinabox.Localtunnel.URL = "Stopped";
    }

    if (step !== "stop") {
      shellinabox.Ngrok.URL = await ngrok.connect(4200);
      return new Promise(function(resolve, reject) {
        localtunnel(4200, function(err, tunnel) {
          shellinabox.Localtunnel.URL = tunnel.url;
          resolve(shellinabox);
        });
      });
    }
  }
  return shellinabox;
};
