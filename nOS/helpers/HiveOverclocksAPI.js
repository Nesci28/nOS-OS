module.exports = async function(gpuName) {
  const axios = require('axios');
  
  let hiveOC = await axios.get(`https://api2.hiveos.farm/api/v2/hive/overclocks?&gpu_brand=nvidia&gpu_model=${gpuName}&algo=x16r&per_page=1`)
  if (hiveOC.data.data.length > 0) return hiveOC.data.data[0].config
  else return 'no DB'
}