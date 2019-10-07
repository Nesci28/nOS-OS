module.exports = async function(json) {
  // Dependancies
  const cp = require("child_process");

  let memType = cp.execSync("sudo ./helpers/amdmeminfo -s -q | cut -d ':' -f5");
  let name = cp.execSync("sudo ./helpers/amdmeminfo -s -q | cut -d ':' -f3");

  for (let i = 0; i < json.Amd.GPU.length; i++) {}
};
