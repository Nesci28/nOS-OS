module.exports = async function(json, step, overclockStatus = "") {
    // Dependancies
    const cp = require("child_process");

    // Setup
    const ocHelper = require("./helpers/HiveOS_API.js");
    const ocSettings = require("../Overclocks.json");
    const amdGPU = require("./helpers/amd_rocm_parser");

    if (overclockStatus == "") {
        overclocksStatus = {
            Overclocks: {
                Nvidia: {
                    Core: null,
                    Mem: null
                },
                Amd: {
                    Mem: null,
                    REF: null
                }
            }
        };
    }
    return (async() => {
        if (step !== "rxboost") {
            if (json.Nvidia.GPU.length > 0) {
                if (overclocksStatus["Overclocks"]["Nvidia"]["Core"] == null)
                    overclocksStatus["Overclocks"]["Nvidia"]["Core"] = [];
                if (overclocksStatus["Overclocks"]["Nvidia"]["Mem"] == null)
                    overclocksStatus["Overclocks"]["Nvidia"]["Mem"] = [];
                var ocCommand = "";

                if (step == "init") {
                    for (let i = 0; i < json.Nvidia.GPU.length; i++) {
                        if (ocSettings.Nvidia["Use Hive_OC"]) {
                            for (let i = 0; i < 10; i++) {
                                try {
                                    var hiveOC = await ocHelper(json.Nvidia.GPU[i].Name, "OC");
                                    break;
                                } catch {
                                    continue;
                                }
                            }
                            if (hiveOC && ocCommand == "") ocCommand += "nvidia-settings ";
                            if (hiveOC.core_clock) {
                                ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${
                  hiveOC.core_clock
                }" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=${
                  hiveOC.core_clock
                }" `;
                                overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] =
                                    hiveOC.core_clock;
                            }
                            if (hiveOC.mem_clock) {
                                ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${
                  hiveOC.mem_clock
                }" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=${
                  hiveOC.mem_clock
                }" `;
                                overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] =
                                    hiveOC.mem_clock;
                            }
                            if (!hiveOC.core_clock && !hiveOC.mem_clock) {
                                localOC(ocSettings, ocCommand, i);
                            }
                        } else {
                            localOC(ocSettings, ocCommand, i);
                        }
                    }
                }

                if (step == "stop") {
                    ocCommand += "nvidia-settings ";
                    for (let i = 0; i < json.Nvidia.GPU.length; i++) {
                        ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=0" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=0" `;
                        ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=0" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=0" `;
                        overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] = "Resetted";
                        overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] = "Resetted";
                    }
                }

                if (ocCommand) cp.execSync(`sudo ${ocCommand}`);
            }
        }

        if (json.Amd.GPU.length > 0) {
            if (overclocksStatus["Overclocks"]["Amd"]["Mem"] == null)
                overclocksStatus["Overclocks"]["Amd"]["Mem"] = ["Initializing"];
            if (overclocksStatus["Overclocks"]["Amd"]["REF"] == null)
                overclocksStatus["Overclocks"]["Amd"]["REF"] = ["Initializing"];
            let amdRocm = cp.execSync("~/nOS/helpers/ROC-smi/rocm-smi");
            let amdStats = amdGPU(amdRocm.toString());
            const amdIDS = [];
            amdStats.gpus.forEach(gpu => {
                amdIDS.push(gpu.gpu);
            });
            var amdCommand = "";

            if (step == "rxboost") {
                // ROCM_SMI
                // // Setting the performance to MANUAL
                // amdIDS.forEach(id => {
                //   amdCommand = "~/nOS/helpers/ROC-smi/rocm-smi ";
                //   amdCommand += `-d ${id} `;
                //   amdCommand += `--setperflevel manual `;
                //   cp.execSync(`sudo ${amdCommand}`);
                // });

                // // Setting the Mem overdrive %
                // amdIDS.forEach((id, index) => {
                //   overclocksStatus["Overclocks"]["Amd"]["Mem"][index] =
                //     ocSettings.Amd.Mem_overdrive;
                //   amdCommand = "~/nOS/helpers/ROC-smi/rocm-smi ";
                //   amdCommand += `-d ${id} `;
                //   amdCommand += `--setmemoverdrive ${ocSettings.Amd.Mem_overdrive} `;
                //   amdCommand += "--autorespond Y";
                //   cp.execSync(`sudo ${amdCommand} 2>/dev/null`);
                // });

                // MY OWN WAY
                // Getting the list of the files to overclock
                let amdGpuFiles = cp.execSync('find / -name pp_od_clk_voltage 2>&1 | grep -v "Permission denied"').toString().trim();
                amdGpuFiles = amdGpuFiles.split('\n');

                // Making sure to reset the gpu to not over-overclock them
                amdGpuFiles.forEach(file => {
                    cp.execSync(`sudo sh -c "echo 'r' > ${file}"`);
                });

                // Overclocking the GPUs
                amdGpuFiles.forEach((file, index) => {
                    let pstatesValues = cp.execSync(`cat ${file} | grep "1:" | tail -1`).toString().trim();
                    pstatesValues = pstatesValues.replace(/\s\s+/g, ' ').split(' ');

                    oldMemClock = pstatesValues[1].replace(/[a-zA-Z]/g, '');
                    voltage = pstatesValues[2].replace(/[a-zA-Z]/g, '');
                    overclockValue = ocSettings.Amd["Mem_overdrive"] / 100;
                    newValue = Math.round(oldMemClock * (1 + overclockValue));

                    overclocksStatus["Overclocks"]["Amd"]["Mem"][index] = newValue;

                    cp.execSync(`sudo sh -c "echo 'm 2 ${newValue} ${voltage}' > ${file}"`);
                    cp.execSync(`sudo sh -c "echo 'c' > ${file}"`);
                });

                // Setting the REF value
                amdCommand = "~/nOS/helpers/amdmemtweak ";
                amdIDS.forEach((id, index) => {
                    overclocksStatus["Overclocks"]["Amd"]["REF"][index] =
                        ocSettings.Amd.Rxboost;
                    if (index == 0 && amdIDS.length == 1) {
                        amdCommand += `--i ${id} `;
                    } else if (index == 0 && amdIDS.length > 1) {
                        amdCommand += `--i ${id}, `;
                    } else if (index < amdIDS.length - 1) {
                        amdCommand += `${id},`;
                    } else {
                        amdCommand += `${id} `;
                    }
                });
                amdCommand += `--REF ${ocSettings.Amd.Rxboost}`;
                cp.execSync(`sudo ${amdCommand}`);
            }

            if (step == "stop") {
                //amdCommand = "~/nOS/helpers/ROC-smi/rocm-smi --resetclocks";
                //cp.execSync(`sudo ${amdCommand}`);
                amdCommand =
                    "~/nOS/helpers/ROC-smi/rocm-smi --resetpoweroverdrive --autorespond Y";
                cp.execSync(`sudo ${amdCommand}`);
            }
        }
        return overclocksStatus;
    })();

    function localOC(ocSettings, ocCommand, i) {
        if (
            (ocSettings.Nvidia.CoreClock && ocCommand == "") ||
            (ocSettings.Nvidia.MemClock && ocCommand == "")
        )
            ocCommand += "nvidia-settings ";
        ocCommand += `-c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[3]=${
      ocSettings.Nvidia.CoreClock
    }" -c :0 -a "[gpu:${i}]/GPUGraphicsClockOffset[2]=${
      ocSettings.Nvidia.CoreClock
    }" `;
        overclocksStatus["Overclocks"]["Nvidia"]["Core"][i] =
            ocSettings.Nvidia.CoreClock;
        ocCommand += `-c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[3]=${
      ocSettings.Nvidia.MemClock
    }" -c :0 -a "[gpu:${i}]/GPUMemoryTransferRateOffset[2]=${
      ocSettings.Nvidia.MemClock
    }" `;
        overclocksStatus["Overclocks"]["Nvidia"]["Mem"][i] =
            ocSettings.Nvidia.MemClock;

        return ocCommand;
    }
};