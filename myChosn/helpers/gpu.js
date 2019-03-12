const { exec } = require('child_process');

const getGPUStats = async () => {
  return new Promise(function(resolve, reject) {
    exec('nvidia-smi --format=noheader,csv --query-gpu=utilization.gpu,clocks.sm,clocks.mem,temperature.gpu,power.draw,fan.speed,pci.sub_device_id,name,uuid,clocks.max.gr,clocks.max.mem', (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

const getGPUList = async () => {
  return new Promise(function(resolve, reject) {
    exec('nvidia-smi -L', (err, stdout, stderr) => {
      if (err) return reject(err);
      let gpuMap = stdout.trim().split('\n').reduce((acc, line)=>{
        let [_, numStr, uuid] = line.match(/GPU (\d+):.+UUID: (.+)\)/)
        return {...acc, [numStr]: uuid}
      }, {});
      resolve(gpuMap);
    });
  });
}


const genericCache = {};
const cache = (name, asyncGetter) => async () => {
  if (genericCache[name]) {
    return genericCache[name]
  } else {
    let data = await asyncGetter();
    genericCache[name] = data;
    return data;
  }
}

module.exports = {
  getGPUList: cache('gpu_list', getGPUList),
  getGPUStats
};
if (!module.parent) {

  let testFun = module.exports.getGPUList;
  const main = async () => {
    console.log(await testFun())
    console.log(await testFun())
    console.log(await testFun())
  }

  main();
}
