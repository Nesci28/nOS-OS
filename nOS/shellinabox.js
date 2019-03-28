module.exports = async function(step) {
  // Dependancies
  const ngrok = require('ngrok');

	const shellinabox = {
		"Shellinabox": {
			"URL": null
		}
	};

  if (step == "shellinabox" || step == 'stop') {
    await ngrok.disconnect();
    await ngrok.kill();
    shellinabox.Shellinabox.URL = 'Stopped'
  }

  if (step !== 'stop') {
    shellinabox.Shellinabox.URL = await ngrok.connect(4200);
  }
  return shellinabox
}
