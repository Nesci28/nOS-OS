module.exports = function(stdout) {
  let gpus = [];
  let processGpu = false;
  let temps = 0;
  let avgTemp = 0;
  let totalPower = 0;
  stdout.split("\n").forEach(line => {
    line = line.trim();
    let toks = line.split(/\s+/);
    if (processGpu) {
      if (toks[0][0] === "=") {
        processGpu = false;
        return;
      }
      if (toks[1] === "N/A") {
        return;
      }
      let gpu = {
        gpu: parseInt(toks[0]),
        temp: parseFloat(toks[1]),
        pwr: parseFloat(toks[2]),
        sclock: parseInt(toks[3]),
        mclock: parseFloat(toks[4]),
        fan: parseInt(toks[5]),
        perf: toks[6],
        utilization: parseInt(toks[9])
      };
      temps += gpu.temp;
      totalPower += gpu.pwr;
      gpus.push(gpu);
    }
    if (toks[0] === "GPU") {
      processGpu = true;
    }
  });
  if (gpus.length) {
    avgTemp = temps / gpus.length;
  }

  gpus.sort((a, b) => a.gpu - b.gpu);

  return {
    gpus,
    avgTemp,
    totalPower
  };
};

if (!module.parent) {
  console.log(
    module.exports(`

========================ROCm System Management Interface========================
================================================================================
GPU  Temp   AvgPwr   SCLK    MCLK    Fan     Perf  PwrCap  VRAM%  GPU%  
0    23.0c  30.203W  300Mhz  300Mhz  42.75%  auto  150.0W  N/A    0%    
================================================================================
==============================End of ROCm SMI Log ==============================

    `)
  );
}
