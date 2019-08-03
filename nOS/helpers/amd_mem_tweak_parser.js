module.exports = function(stdout) {
  const object = []
  let gpus = []
  stdout.trim().split("GPU").forEach((line, i) => {
    line.split("\n").forEach(ele => {
      ele.split("\t").forEach(element => {
        if (/[A-Z]: [0-9]/.test(element)) {
          if (/BUS_TURN: [0-9]/.test(element)) gpus.push(element.replace(/ /g, '').trim() + "\n")
          else gpus.push(element.replace(/ /g, '').trim())
        }
      })
    })
  })
  gpus = gpus.join(' ').trim().split("\n")
  gpus.forEach(tok => {
    object.push({})
    tok.split(' ').forEach(ele => {
      if (ele) {
        ele = ele.trim().split(':')
        object[object.length - 1][ele[0].toString()] = Number(ele[1])
      }
    })
  })
  return object
}             

if (!module.parent) {
  console.log(module.exports(`
  GPU 0:  Ellesmere [Radeon RX 470/480/570/570X/580/580X]	pci:0000:01:00.0
  CAS
    CL: 7	  W2R: 11	  CCDS: 5	  CCLD: 2	  R2W: 15	  NOPR: 0	  NOPW: 0
  RAS
    RC: 18	  RRD: 1	  RCDRA: 5	  RCDR: 5	  RCDWA: 4	  RCDW: 4
  MISC
    RFC: 39	  TRP: 6	  RP_RDA: 9	  RP_WRA: 21
  MISC2
    WDATATR: 0	  T32AW: 2	  CRCWL: 16	  CRCRL: 1	  FAW: 0	  PA2WDATA: 0	  PA2RDATA: 0
  DRAM1
    RASMACTWR: 21	  RASMACTRD: 19	  ACTWR: 7	  ACTRD: 9
  DRAM2
    RAS2RAS: 9	  RP: 7	  WRPLUSRP: 19	  BUS_TURN: 21
  GPU 1:  Ellesmere [Radeon RX 470/480/570/570X/580/580X]	pci:0000:02:00.0
  CAS
    CL: 7	  W2R: 11	  CCDS: 5	  CCLD: 2	  R2W: 15	  NOPR: 0	  NOPW: 0
  RAS
    RC: 18	  RRD: 1	  RCDRA: 5	  RCDR: 5	  RCDWA: 4	  RCDW: 4
  MISC
    RFC: 39	  TRP: 6	  RP_RDA: 9	  RP_WRA: 21
  MISC2
    WDATATR: 0	  T32AW: 2	  CRCWL: 16	  CRCRL: 1	  FAW: 0	  PA2WDATA: 0	  PA2RDATA: 0
  DRAM1
    RASMACTWR: 21	  RASMACTRD: 19	  ACTWR: 7	  ACTRD: 9
  DRAM2
    RAS2RAS: 9	  RP: 7	  WRPLUSRP: 19	  BUS_TURN: 21
  `))
}