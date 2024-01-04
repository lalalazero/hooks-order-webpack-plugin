const chalk = require("chalk");
const { compilationHooks, compilerHooks, normalModuleFactoryHooks, HooksMap } = require("./hooks");

const PLUGIN_NAME = "LogRuntimeHooksOrderPlugin";

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
		const log = getLog(prefix);
		hook.tap(PLUGIN_NAME, () => {
			log(fullname);
		});
	}
}

function getLog(owner) {
	const colorMap = {
		compiler: "red",
		compilation: "yellow",
		normalModuleFactory: "blue",
		"normalModuleFactory.createParser": "green",
		"normalModuleFactory.parser": "green",
	};

	return function (...text) {
		console.log(chalk[colorMap[owner]](...text));
	};
}
function tapHook(hookName, target, mockTarget, owner) {
	const log = getLog(owner);

	const hook = target[hookName];
	const fakeHook = mockTarget[hookName];

	if (fakeHook.isHookMap) {
		tapHookMap([owner, hookName], hook);
		return;
	}

	const fn = hook.constructor.name;

	const isAsync = fn.indexOf("Async") > -1;

	if (isAsync) {
		hook.tapAsync(PLUGIN_NAME, function () {
			const len = arguments.length;
			const callback = arguments[len - 1];
			if (callback && typeof callback === "function") {
				log(`${owner}.hooks.${hookName}`);
				callback();
			}
		});
	} else {
		hook.tap(PLUGIN_NAME, () => {
			log(`${owner}.hooks.${hookName}`);
		});
	}
}

class LogRuntimeHooksOrderPlugin {
	constructor() {}

	apply(compiler) {
		const compilerHookNames = Object.keys(compilerHooks);
		for (let hookName of compilerHookNames) {
			tapHook(hookName, compiler.hooksOrigin, compilerHooks, "compiler");
		}

		compiler.hooksOrigin.compilation.tap(PLUGIN_NAME, (compilation, params) => {
			const compilationHookNames = Object.keys(compilationHooks);
			for (let hookName of compilationHookNames) {
				tapHook(hookName, compilation.hooksOrigin, compilationHooks, "compilation");
			}

			const nmfHookNames = Object.keys(normalModuleFactoryHooks);
			for (let hookName of nmfHookNames) {
				tapHook(hookName, params.normalModuleFactory.hooksOrigin, normalModuleFactoryHooks, "normalModuleFactory");
			}
		});
	}
}

module.exports = LogRuntimeHooksOrderPlugin;
