module.exports = async function(step) {
  // Dependancies
  const ngrok = require("ngrok");
  const cp = require("child_process");

  const systemConfigs = require("../SystemConfig.json");

  const shellinabox = {
    Shellinabox: {
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
      shellinabox.Shellinabox.URL = "Stopped";
    }

    if (step !== "stop") {
      shellinabox.Shellinabox.URL = await ngrok.connect(4200);
      let ls = cp.spawn("lt", ["--port", "4200"]);
      ls.stdout.on("data", function(data) {
        shellinabox.Localtunnel.URL = data
          .toString()
          .split(" ")[3]
          .replace("\n", "");
      });
    }
  }
  return shellinabox;
};
