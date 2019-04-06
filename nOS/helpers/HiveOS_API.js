module.exports = async function(gpuName, control, miner) {
  const axios = require('axios');
  
  if (control == 'OC') {
    let hiveOC = await axios.get(`https://api2.hiveos.farm/api/v2/hive/overclocks?&gpu_brand=nvidia&gpu_model=${gpuName}&algo=x16r&per_page=1`)
    if (hiveOC.data.data.length > 0) return hiveOC.data.data[0].config
    else return 'no DB'
  }

  if (control == 'Miners') {
    let hiveMiners = await axios.get(`https://api2.hiveos.farm/api/v2/hive/miners`)
    let hiveVersions = hiveMiners.data.data.find(obj => obj.id === `${miner}`);
    let hiveVersionNumber = hiveVersions.versions[hiveVersions.versions.length-1]
    if (RegExp('-').test(hiveVersionNumber)) {
      hiveVersionNumber = hiveVersionNumber.split('-')[0]
    }
  
    let localVersion = fs.readFileSync(`../Miners/T-Rex/version`).toString().trim()
    if (hiveVersionNumber !== localVersion) return { "Miner": "New miner version detected" }
  }
}