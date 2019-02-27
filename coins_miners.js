const fs = require('fs');
const crypto = require('crypto');

const ENC_FILE = '/home/chosn/CHOSN/Coins_Miners';
const PASSWORD = 'PoisonXASaysHackMe2018';

class CoinsMiners {
  read() {
    try {
      var data = fs.readFileSync(ENC_FILE);
      var decipher = crypto.createDecipher("aes-256-cbc", PASSWORD);
      var decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
      return JSON.parse(decrypted.toString());
    } catch (exception) {
      return {
        Miners: {}
      };
    }
  }

  reset() {
    this._save({});
  }

  update(data) {
    this._save(data);
  }

  _save(data) {
    try {
      var cipher = crypto.createCipher('aes-256-cbc', PASSWORD);
      var encrypted = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(data), "utf8")), cipher.final()]);
      fs.writeFileSync(ENC_FILE, encrypted);
    } catch (exception) {
      throw new Error(exception.message);
    }
  }

  _edit(editor) {
    let data = editor(this.read());
    this._save(data);
  }

  change({type,algo,choice}){
    let {map} = this.getMinerChoices(algo, type);
    let miner = map[choice];
    this._edit((data)=>{
      data["User"][algo][type] = miner
      return data;
    });
    return { miner, type, algo };
  }
  add({type, name, algo, path, command}){
    let m = null;
    this._edit((data)=>{
      if (data["Miners"][name]) {
        m = data["Miners"][name]
        let p = m.Platforms || [];
        p.push(type);
        p = [...new Set(p)]
        m.Platforms = p
        let a = m.Algorithms || [];
        a.push(algo);
        a = [...new Set(a)]
        m.Algorithms = a
      } else {
        m = {
          "Name": name,
          "Algorithms": [algo],
          "Platforms": [type],
          "Path": path,
          "Command": command
        }
      }
      let stub = {}
      let algoU = algo.toUpperCase()
      stub[type]=name;
      data["User"][algoU]=stub;
      data["Default"][algoU]=stub;
      data["Miners"][name] = m;
      return data;
    });
    return m;
  }
  getMiner(algo, plat, scope=null) {
    let data = this.read()
    if (scope) {
      scope = scope.split(',')
    } else {
      scope = ["User", "Default"]
    }
    for (let ps of scope) {
      let uM = data[ps][algo]
      if (uM && uM[plat] && uM[plat].length > 0) {
        return uM[plat]
      }
    } 
  }
  getAlgos() {
    let algos = {}
    let data = this.read()
    let scope = ["User", "Default"]
    for (let ps of scope) {
      Object.keys(data[ps]).forEach(algo=> algos[algo] = 1)
    } 
    return Object.keys(algos).sort()
  }
  getMinerChoices(algo, plat) {
    plat = plat.replace('_PREM', '');
    let choices = {}
    let data = this.read();
    Object.keys(data["Miners"]).filter((name)=>{
      let miner = data["Miners"][name];
      if( miner.Algorithms &&
        miner.Algorithms.includes(algo) &&
        miner.Platforms &&
        miner.Platforms.includes(plat) ) {
        choices[name] = miner 
      }
    })
    let names = Object.keys(choices);

    let x = 1

    let map = {}
    let out = "";
    for (var i=0; i<names.length; i++) {
      out+=`${i+x}\n${names[i]}\n`
      map[i+x] = names[i];
    }

    out = out.trim()

    return { out, i: names.length+x, map }
  }
}

module.exports = new CoinsMiners();
