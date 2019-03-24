module.exports = async function() {
  // Dependancies
  const ngrok = require('ngrok');

	const shellinabox = {
		"Shellinabox": {
			"URL": null
		}
	};

  shellinabox.Shellinabox.URL = await ngrok.connect(4200);

  // await localtunnel(4200, function(err, tunnel) {
  //   if (err) {
  //     console.log(err)
  //   } else {
  //     shellinabox.Shellinabox.URL = tunnel.url
  //   }
  // });
  return shellinabox
}
