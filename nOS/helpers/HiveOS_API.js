module.exports = async function(gpuName, control) {
  const axios = require('axios');
  
  if (control == 'OC') {
    let hiveOC = await axios.get(`https://api2.hiveos.farm/api/v2/hive/overclocks?&gpu_brand=nvidia&gpu_model=${gpuName}&algo=x16r&per_page=1`)
    if (hiveOC.data.data.length > 0) return hiveOC.data.data[0].config
    else return 'no DB'
  }

  if (control == 'Miners') {
    let hiveMiners = await axios.get(`https://api2.hiveos.farm/api/v2/hive/miners`)
    console.log(hiveMiners.data.data)
  }
}