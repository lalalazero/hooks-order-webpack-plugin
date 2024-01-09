const chalk = require("chalk");

const HOOK_COLOR_MAP = {
  compiler: "red",
  compilation: "yellow",

  //factory
  normalModuleFactory: "blue",
  contextModuleFactory: "yellow",
  resolverFactory: "yellow",

  // factory sub-item
  "normalModuleFactory.createParser": "green",
  "normalModuleFactory.parser": "green",

  // template
  mainTemplate: "red",
  chunkTemplate: "green",
  moduleTemplate: "blue",
};

const HOOK_MAP_NAMES = {
  // factory
  "normalModuleFactory.createParser": [
    "javascript/auto",
    "javascript/dynamic",
    "javascript/esm",
  ],
  "normalModuleFactory.parser": [
    "javascript/auto",
    "javascript/dynamic",
    "javascript/esm",
  ],
  "resolverFactory.resolver": ["normal", "context", "loader"],
  "resolverFactory.resolveOptions": ["normal", "context", "loader"],

  // parser
  "javascript/auto.parser.evaluate": [
    "Literal",
    "Identifier",
    "CallExpression",
  ],
  "javascript/auto.parser.expression": ["require"],
};

class Logger {
  constructor(silent) {
    this.silent = silent;
    this.rawLogs = [];
    this.invalidLogs = [];
  }
  getLogger(owner) {
    const log = (...text) => {
      const content = text.join("");
      this.rawLogs.push(content);
      if (this.silent) {
        return;
      }
      const color = HOOK_COLOR_MAP[owner] || "blue";

      console.log(chalk[color](...text));
    };

    log.invalid = (...text) => {
      const content = text.join("");
      this.invalidLogs.push(content);
    };

    return log;
  }
  getRawLogs() {
    if (this.rawLogs.length > 0) {
      return this.rawLogs.join("\n");
    }
    return null;
  }
  getInvalidLogs() {
    if (this.invalidLogs.length > 0) {
      return this.invalidLogs.join("\n");
    }
    return null;
  }
}

module.exports = {
  Logger,
  HOOK_MAP_NAMES,
};
