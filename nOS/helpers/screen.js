const EventEmitter = require('events').EventEmitter;
const spawn = require('child_process').spawn;

class Screen extends EventEmitter {

  constructor(command, pipes) {
    this.proc = spawn(command);
    this.proc.stdout.pipe(pipes.stdout); /// example
  }
  // ... whatever itnerface you need from screen, you can probably implement in this class
}

const myScreens = [];
function screen(cmd) {
  let scr = new Screen(cmd);
  myScreens.push(scr);
  return scr;
}
// and now replace those invocations with 
// screen("my command");