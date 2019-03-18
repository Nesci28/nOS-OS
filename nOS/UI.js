module.exports = function(json, step, tables = '') {
  // dependancies
  const table = require('tty-table');
  const chalk = require('chalk');

  // setup
  const ocSettings = require('../Overclocks.json');

  if (json["Nvidia"]["Coin"] && json.Nvidia.GPU.length > 0) {
    tables += showCoin(json, 'Nvidia')
    tables += showGPU(json, 'Nvidia', json.Nvidia.GPU.length, step)
  }

  if (json["Amd"]["Coin"] && json.Amd.GPU.length > 0) {
    tables += showCoin(json, 'Amd')
    tables += showGPU(json, 'Amd', json.Amd.GPU.length, step)
  }

  return tables

  function showCoin(json, brand) {
    let value = ''
    if (json[brand]['Coin Info'].wallet) {
      value = [["Wallet", json[brand]['Coin Info'].wallet], ["URI", json[brand]['Coin Info'].poolUri1], ['Command', json[brand]['Coin Info'].command]]
    } else {
      value = [["Account", json[brand]['Coin Info'].account], ["URI", json[brand]['Coin Info'].poolUri1], ['Command', json[brand]['Coin Info'].command]]
    }
    let t1 = table('',value,{
      width: 'auto',
      borderStyle : 1,
      borderColor : "blue",
      align : "center",
      color : "white",
    });
    str1 = t1.render();
    return str1
  }
  
  function showGPU(json, brand, gpuNumber, step) {
    let header = [
      {
        value : brand,
        headerColor : "cyan",
        color: "white",
        align : "left",
      },
      {
        value : "temp °C",
        color : "white", 
        formatter : function(value){
          let str = value
          if (value < ocSettings["Nvidia"]["Max Temperature"] - 3) {
            str = chalk.green(str);
          } else if (value >= ocSettings["Nvidia"]["Max Temperature"] - 3 && value <= ocSettings["Nvidia"]["Max Temperature"] + 3) {
            str = chalk.yellow(str);
          } else if (value > ocSettings["Nvidia"]["Max Temperature"] + 3) {
            str = chalk.red(str);
          }
          return str;
        }
      },
      {
        alias : "Fan %",  
        value : "organic",
      },
      {
        alias : "Watt W",  
        value : "organic",
        formatter : function(value){
          let str = value
          str = Math.round(str.split(' ')[0])
          return str;
        }
      },
      {
        alias : "Core MHz",  
        value : "organic",
      },
      {
        alias : "Mem MHz",  
        value : "organic",
      },
      {
        alias : "Hashrate",  
        value : "organic",
      }
    ];

    let value = []
    if (step !== 'init') {
      for (let i = 0; i < gpuNumber; i++) {
        value.push([json[brand].GPU[i].Name, json[brand].GPU[i].Temperature, json[brand].GPU[i]["Fan Speed"].split(' ')[0], json[brand].GPU[i].Watt, json[brand].GPU[i]["Core Clock"].split(' ')[0], json[brand].GPU[i]["Mem Clock"].split(' ')[0], json[brand].GPU[i].Hashrate.split(' ')[0]])
      }
    } else {
      for (let i = 0; i < gpuNumber; i++) {
        value.push([json[brand].GPU[i].Name, json[brand].GPU[i].Temperature, json[brand].GPU[i]["Fan Speed"].split(' ')[0], json[brand].GPU[i].Watt, json[brand].GPU[i]["Core Clock"].split(' ')[0], json[brand].GPU[i]["Mem Clock"].split(' ')[0], 'Initializing'])
      }
    }

    let t1 = table(header,value,{
      borderStyle : 1,
      borderColor : "blue",
      headerAlign : "center",
      align : "center",
      color : "white",
      truncate: "..."
    });

    str1 = t1.render();
    return str1
  }
}