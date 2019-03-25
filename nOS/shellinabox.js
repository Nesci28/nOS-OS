module.exports = async function(step) {
  // Dependancies
  const ngrok = require('ngrok');

	const shellinabox = {
		"Shellinabox": {
			"URL": null
		}
	};

  if (step == "shellinabox") {
    await ngrok.disconnect();
  }

  shellinabox.Shellinabox.URL = await ngrok.connect(4200);
  return shellinabox
}
