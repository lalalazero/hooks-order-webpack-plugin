const chalk = require("chalk");

class Logger {
  constructor(silent) {
    this.silent = silent;
    this.rawLogs = [];
  }
  getLogger(owner) {
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

    return (...text) => {
      let str = "";
      for (let i of text) {
        str += text;
      }
      this.rawLogs.push(str);
      if (this.silent) {
        return;
      }
      console.log(chalk[colorMap[owner]](...text));
    };
  }
  getRawLogs() {
    if (this.rawLogs.length > 0) {
      return this.rawLogs.join("\n");
    }
    return null;
  }
}

module.exports = {
  Logger,
};
