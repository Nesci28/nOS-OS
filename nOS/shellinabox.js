module.exports = async function(step) {
  // Dependancies
  const ngrok = require('ngrok');
  const cp = require('child_process');

  const systemConfigs = require('../SystemConfig.json');

	const shellinabox = {
		"Shellinabox": {
			"URL": null
		}
	};

  if (step !== 'stop') {
    if (systemConfigs.Shellinabox) {
      try {
        var shellIsRunning = cp.execSync('ps aux | grep "[s]hellinaboxd"')
      } catch {
        var shellIsRunning = false 
      }

      if (!shellIsRunning) cp.exec('shellinaboxd &')
      
      if (step == "shellinabox" || step == 'stop') {
        await ngrok.disconnect();
        await ngrok.kill();
        shellinabox.Shellinabox.URL = 'Stopped'
      }

      if (step !== 'stop') {
        shellinabox.Shellinabox.URL = await ngrok.connect(4200);
      }
    }
  }

  return shellinabox
}
