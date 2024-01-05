const { getLogs, getLogger } = require("./helper");
const chalk = require("chalk");

const PLUGIN_NAME = "LogRuntimeHooksOrderPlugin";
const HooksMap = {};

function tapHookMap(hookMapKeys, hookMap) {
  let len = hookMapKeys.length;
  const keyNames = hookMapKeys.slice(0, len);
  function digHooks(mapKeys, i, map = {}) {
    let key = mapKeys[i];

    let value = map[key];
    if (Array.isArray(value)) {
      return value;
    }

    if (i >= len) {
      return [];
    }
    return digHooks(mapKeys, i + 1, map[key]);
  }

  let hooks = digHooks(hookMapKeys, 0, HooksMap);
  for (let hookName of hooks) {
    const hook = hookMap.for(hookName);
    const prefix = keyNames.join(".");
    const fullname = `${prefix}.${hookName}`;
    const log = getLogger(prefix);
    hook.tap(PLUGIN_NAME, () => {
      log(fullname);
    });
  }
}

function hookInto(target, owner) {
  const log = getLogger(owner);
  const hooks = target.hooks;
  const hookNames = Object.keys(hooks);

  for (let hookName of hookNames) {
    const hook = hooks[hookName];

    const fn = hook.constructor.name;
    const isHookMap = fn.indexOf("HookMap") > -1;
    if (isHookMap) {
      return;
    }

    const isAsync = fn.indexOf("Async") > -1;
    const isWaterfall = fn.indexOf("Waterfall") > -1;

    try {
      if (isAsync) {
        hook.tapAsync(PLUGIN_NAME, function () {
          const len = arguments.length;
          const callback = arguments[len - 1];
          const result = Array.from(arguments[(0, len - 1)]);
          if (result && isWaterfall && callback) {
            callback(null, ...result);
            return;
          }
          if (callback && typeof callback === "function") {
            log(`${owner}.hooks.${hookName}`);
            callback(...result);
          }
        });
      } else {
        hook.tap(PLUGIN_NAME, (...args) => {
          log(`${owner}.hooks.${hookName}`);

          if (args && args[0] && isWaterfall) {
            return args[0];
          }
        });
      }
    } catch (e) {
      log(`${owner}.hooks.${hookName}` + chalk.red(" caught error"));
    }
  }
}

const defaultConfig = {
  compiler: true,
  compilation: true,
  normalModuleFactory: true,
  contextModuleFactory: true,
  resolver: true,
  parser: true,
  moduleTemplate: true,
  chunkTemplate: true,
  mainTemplate: true,
};

class LogRuntimeHooksOrderPlugin {
  constructor(userConfig = { verbose: true, silent: false }, version = 4) {
    this.logger = 
    this.version = version;
    if (userConfig.verbose === true) {
      this.config = {
        ...defaultConfig,
        ...userConfig,
      };
    } else {
      this.config = userConfig;
    }
  }

  getModuleTemplate(compilation) {
    debugger;
    if (this.version === 4) {
      return compilation.moduleTemplate;
    }
    return compilation.moduleTemplates.javascript;
  }

  applyCompilerHooks(compiler) {
    if (!this.config.compiler) {
      return;
    }
    hookInto(compiler, "compiler");
  }

  applyCompilationHooks(compiler) {
    if (!this.config.compilation) {
      return;
    }
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, params) => {
      hookInto(compilation, "compilation");
    });
  }

  applyTemplateHooks(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      ["moduleTemplate", "chunkTemplate", "mainTemplate"]
        .filter((name) => this.config[name])
        .forEach((name) => {
          let template = compilation[name];
          if (name === "moduleTemplate") {
            template = this.getModuleTemplate(compilation);
          }
          hookInto(template, name);
        });
    });
  }

  applyResolverHooks() {}

  applyParserHooks() {}

  applyFactoryHooks(compiler) {
    ["normalModuleFactory", "contextModuleFactory"]
      .filter((name) => this.config[name])
      .forEach((name) => {
        compiler.hooks[name].tap(PLUGIN_NAME, (factory) => {
          hookInto(factory, name);
        });
      });
  }

  tapForAssets(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, (callback) => {
        const rawLog = getLogs();
        compilation.assets["runtime-hooks-order.txt"] = {
          source: function () {
            return rawLog;
          },
        };

        callback();
      });
    });
  }

  apply(compiler) {
    this.applyCompilerHooks(compiler);
    this.applyCompilationHooks(compiler);
    this.applyFactoryHooks(compiler);
    this.applyTemplateHooks(compiler);
    this.tapForAssets(compiler);
  }
}

module.exports = LogRuntimeHooksOrderPlugin;
