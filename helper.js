const chalk = require("chalk");

const logs = []

class Logger {
  constructor(silent) {
  }
}

function getLogger(owner) {
  const colorMap = {
    compiler: "red",
    compilation: "yellow",
    normalModuleFactory: "blue",
    contextModuleFactory: "yellow",
    "normalModuleFactory.createParser": "green",
    "normalModuleFactory.parser": "green",
    mainTemplate: "red",
    chunkTemplate: "green",
    moduleTemplate: "blue",
  };

  return function (...text) {
    let str = ''
    for(let i of text) {
      str += text
    }
    logs.push(str)
    console.log(chalk[colorMap[owner]](...text));
  };
}

function getLogs() {
  return logs.join('\n')
}


module.exports = {
  getLogger,
  getLogs,
};
