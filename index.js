const { Logger, HOOK_MAP_NAMES } = require("./helper");

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

const DEFAULT_ASSET_NAME = "runtime-hooks-order.txt";

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
      const { isAsync, isWaterfall, isBail, isHookMap } = parseHookName(hook);

      try {
        if (isHookMap) {
          this.hookIntoMap(hook, `${owner}.${hookName}`);
          continue;
        }
        if (isAsync) {
          hook.tapAsync(PLUGIN_NAME, function () {
            const len = arguments.length;
            const callback = arguments[len - 1];
            const result = Array.from(arguments[(0, len - 1)]);
            const validCallback = callback && typeof callback === "function";
            log(`${owner}.hooks.${hookName}`);
            if (isBail && validCallback) {
              callback();
              return;
            }
            if (result && isWaterfall && validCallback) {
              callback(null, ...result);
              return;
            }
            if (validCallback) {
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
        log(`${owner}.hooks.${hookName} caught error`);
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
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, (callback) => {
        const rawLog = this.logger.getRawLogs();
        if (rawLog) {
          compilation.assets[this.config.filename] = {
            source: function () {
              return rawLog;
            },
            size: function () {
              return 2345;
            },
          };
        }

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

exports = module.exports = LogRuntimeHooksOrderPlugin;
exports.config = defaultConfig;
exports.LogRuntimeHooksOrderPlugin = LogRuntimeHooksOrderPlugin;
