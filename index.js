const { Logger, HOOK_MAP_NAMES } = require("./helper");
const path = require("path");
const fs = require("fs");

const PLUGIN_NAME = "LogRuntimeHooksOrderPlugin";

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

const DEFAULT_ASSET_NAME = "all.txt";

const parseHookName = (hook) => {
  const name = hook.constructor.name;

  const isBail = name.indexOf("Bail") > -1;
  const isSync = name.indexOf("Sync") > -1;
  const isAsync = name.indexOf("Async") > -1;
  const isWaterfall = name.indexOf("Waterfall") > -1;
  const isHookMap = name.indexOf("HookMap") > -1;

  return {
    isBail,
    isSync,
    isAsync,
    isWaterfall,
    isHookMap,
    hookType: name,
  };
};

class LogRuntimeHooksOrderPlugin {
  constructor(userConfig = {}, version = 4) {
    userConfig = {
      verbose: true,
      filename: DEFAULT_ASSET_NAME,
      silent: false,
      ...userConfig,
    };
    this.logger = new Logger(userConfig.silent);
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
  hookIntoMap(hookMap, hookMapName) {
    const hookNames = HOOK_MAP_NAMES[hookMapName] || [];

    hookNames.forEach((hookName) => {
      const hook = hookMap.for(hookName);

      this.hookIntoMapHook(hook, hookName, hookMapName);
    });
  }
  hookIntoMapHook(hook, hookName, caller) {
    const log = this.logger.getLogger(caller);
    const { isAsync, isWaterfall } = parseHookName(hook);
    if (isAsync) {
      throw new Error("todo async hookmap");
    }
    hook.tap(PLUGIN_NAME, (...result) => {
      const text = `${caller}.${hookName}`;
      log(text);

      if (isWaterfall) {
        return result && result[0];
      }
    });
  }
  hookInto(target, owner) {
    if (!target || !target.hooks) {
      console.error(`cannot hook into ${owner}`);
      return;
    }
    const hooks = target.hooks;
    const hookNames = Object.keys(hooks);
    const log = this.logger.getLogger(owner);

    for (let hookName of hookNames) {
      const hook = hooks[hookName];
      const { isAsync, isWaterfall, isBail, isHookMap, hookType } =
        parseHookName(hook);

      try {
        if (isHookMap) {
          this.hookIntoMap(hook, `${owner}.${hookName}`);
          continue;
        }
        if (isAsync) {
          hook.tapAsync(PLUGIN_NAME, function () {
            log(`${owner}.hooks.${hookName} ${hookType}`);
            const params = Array.prototype.slice.call(arguments);
            let callback = null;
            if (params.length === 1) {
              callback = params.shift();
            } else if (params.length > 0) {
              callback = params.pop();
            }
            const validCallback = callback && typeof callback === "function";
            if (isBail && validCallback) {
              callback();
              return;
            }
            if (params.length && isWaterfall && validCallback) {
              callback.apply(null, null, params);
              return;
            }
            if (validCallback) {
              callback(null, ...params);
            }
          });
        } else {
          hook.tap(PLUGIN_NAME, function () {
            const params = Array.prototype.slice.call(arguments);

            log(`${owner}.hooks.${hookName} ${hookType}`);

            if (params && params[0] && isWaterfall) {
              return params[0];
            }
          });
        }
      } catch (e) {
        log(`${owner}.hooks.${hookName}-${hookType} caught error`);
      }
    }
  }

  getModuleTemplate(compilation) {
    if (this.version === 4) {
      return compilation.moduleTemplate;
    }
    return compilation.moduleTemplates.javascript;
  }

  applyCompilerHooks(compiler) {
    if (this.config.compiler) {
      this.hookInto(compiler, "compiler");
    }
  }

  applyCompilationHooks(compiler) {
    if (this.config.compilation) {
      compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation, params) => {
        this.hookInto(compilation, "compilation");
      });
    }
  }

  applyTemplateHooks(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      ["moduleTemplate", "chunkTemplate", "mainTemplate"]
        .filter((name) => !!this.config[name])
        .forEach((name) => {
          let template = compilation[name];
          if (name === "moduleTemplate") {
            template = this.getModuleTemplate(compilation);
          }
          this.hookInto(template, name);
        });
    });
  }

  applyResolverHooks() {}

  applyParserHooks() {}

  applyFactoryHooks(compiler) {
    ["normalModuleFactory", "contextModuleFactory"]
      .filter((name) => !!this.config[name])
      .forEach((name) => {
        compiler.hooks[name].tap(PLUGIN_NAME, (factory) => {
          this.hookInto(factory, name);
        });
      });
  }

  tapForAssets(compiler) {
    compiler.hooks.done.tap(PLUGIN_NAME, () => {
      const text = this.logger.getRawLogs();
      if (text) {
        const file = path.resolve(compiler.outputPath, this.config.filename);
        fs.writeFileSync(file, text, "utf8");
      }
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

exports = module.exports = LogRuntimeHooksOrderPlugin;
exports.config = defaultConfig;
exports.LogRuntimeHooksOrderPlugin = LogRuntimeHooksOrderPlugin;
