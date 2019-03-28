module.exports = function(stdout) {
  let gpus = [];
  let processGpu = false;
  let temps = 0;
  let avgTemp = 0;
  let totalPower = 0;
  stdout.split("\n").forEach(line=>{
    line = line.trim();
    let toks = line.split(/\s+/);
    if (processGpu) {
      if (toks[0][0] === "=") {
        processGpu = false;
        return;
      }
      if (toks[1]==="N/A") {
        return;
      }
      let gpu = {
        gpu: parseInt(toks[0]),
        temp: parseFloat(toks[1]),
        pwr: parseFloat(toks[2]),
        sclock: parseInt(toks[3]),
        mclock: parseFloat(toks[4]),
        fan: parseFloat(toks[6]),
        perf: toks[7],
        sclockod: parseFloat(toks[10]),
        utilization: parseInt(toks[12])
      }
      temps+=gpu.temp;
      totalPower+=gpu.pwr;
      gpus.push(gpu);
    }
    if (toks[0] === "GPU") {
      processGpu = true
    }
  });
  if (gpus.length) {
    avgTemp = temps / gpus.length
  }

  gpus.sort((a,b)=>a.gpu - b.gpu)

  return {
    gpus,
    avgTemp,
    totalPower
  }
}

if (!module.parent) {
console.log(module.exports(`

====================    ROCm System Management Interface    ====================
================================================================================
 GPU  Temp    AvgPwr   SCLK     MCLK     Fan      Perf    SCLK OD
  1   N/A     N/A      N/A      N/A      0%       N/A       N/A
  0   31.0c   53.126W  1340Mhz  300Mhz   29.8%    manual    0%
================================================================================
====================           End of ROCm SMI Log          ====================

========================        ROCm System Management Interface        ========================
================================================================================================
GPU   Temp   AvgPwr   SCLK    MCLK    PCLK           Fan     Perf    PwrCap   SCLK OD   MCLK OD  GPU%
0     27.0c  32.192W  613Mhz  300Mhz  N/A            42.75%  auto    114.0W   0%        0%       0%       
1     25.0c  28.102W  300Mhz  300Mhz  2.5GT/s, x8    23.92%  auto    114.0W   0%        0%       0%       
================================================================================================
========================               End of ROCm SMI Log              ========================


`))
}
