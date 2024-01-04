class SyncHook {
	constructor() {}
}
class SyncBailHook {
	constructor() {}
}
class AsyncSeriesHook {
	constructor() {}
}
class SyncWaterfallHook {
	constructor() {}
}
class AsyncSeriesWaterfallHook {
	constructor() {}
}
class HookMap {
	constructor() {}
}
class AsyncParallelHook {
	constructor() {}
}

const compilerHooks = {
	shouldEmit: new SyncBailHook(["compilation"]),
	done: new SyncHook(["stats"]),
	additionalPass: new AsyncSeriesHook([]),
	beforeRun: new AsyncSeriesHook(["compilation"]),
	run: new AsyncSeriesHook(["compilation"]),
	emit: new AsyncSeriesHook(["compilation"]),
	afterEmit: new AsyncSeriesHook(["compilation"]),
	thisCompilation: new SyncHook(["compilation", "params"]),
	compilation: new SyncHook(["compilation", "params"]),
	normalModuleFactory: new SyncHook(["normalModuleFactory"]),
	contextModuleFactory: new SyncHook(["contextModulefactory"]),
	beforeCompile: new AsyncSeriesHook(["params"]),
	compile: new SyncHook(["params"]),
	make: new AsyncParallelHook(["compilation"]),
	afterCompile: new AsyncSeriesHook(["compilation"]),
	watchRun: new AsyncSeriesHook(["compiler"]),
	failed: new SyncHook(["error"]),
	invalid: new SyncHook(["filename", "changeTime"]),
	watchClose: new SyncHook([]),

	// TODO the following hooks are weirdly located here
	// TODO move them for webpack 5
	environment: new SyncHook([]),
	afterEnvironment: new SyncHook([]),
	afterPlugins: new SyncHook(["compiler"]),
	afterResolvers: new SyncHook(["compiler"]),
	entryOption: new SyncBailHook(["context", "entry"]),
};

const compilationHooks = {
	buildModule: new SyncHook(["module"]),
	failedModule: new SyncHook(["module", "error"]),
	succeedModule: new SyncHook(["module"]),

	finishModules: new SyncHook(["modules"]),

	unseal: new SyncHook([]),
	seal: new SyncHook([]),

	optimizeDependenciesBasic: new SyncBailHook(["modules"]),
	optimizeDependencies: new SyncBailHook(["modules"]),
	optimizeDependenciesAdvanced: new SyncBailHook(["modules"]),
	afterOptimizeDependencies: new SyncHook(["modules"]),

	optimize: new SyncHook([]),

	optimizeModulesBasic: new SyncBailHook(["modules"]),
	optimizeModules: new SyncBailHook(["modules"]),
	optimizeModulesAdvanced: new SyncBailHook(["modules"]),
	afterOptimizeModules: new SyncHook(["modules"]),

	optimizeChunksBasic: new SyncBailHook(["chunks"]),
	optimizeChunks: new SyncBailHook(["chunks"]),
	optimizeChunksAdvanced: new SyncBailHook(["chunks"]),
	afterOptimizeChunks: new SyncHook(["chunks"]),

	optimizeTree: new AsyncSeriesHook(["chunks", "modules"]),
	afterOptimizeTree: new SyncHook(["chunks", "modules"]),

	optimizeChunkModulesBasic: new SyncBailHook(["chunks", "modules"]),
	optimizeChunkModules: new SyncBailHook(["chunks", "modules"]),
	optimizeChunkModulesAdvanced: new SyncBailHook(["chunks", "modules"]),
	afterOptimizeChunkModules: new SyncHook(["chunks", "modules"]),
	shouldRecord: new SyncBailHook([]),

	reviveModules: new SyncHook(["modules", "records"]),
	optimizeModuleOrder: new SyncHook(["modules"]),
	advancedOptimizeModuleOrder: new SyncHook(["modules"]),
	beforeModuleIds: new SyncHook(["modules"]),
	moduleIds: new SyncHook(["modules"]),
	optimizeModuleIds: new SyncHook(["modules"]),
	afterOptimizeModuleIds: new SyncHook(["modules"]),

	reviveChunks: new SyncHook(["chunks", "records"]),
	optimizeChunkOrder: new SyncHook(["chunks"]),
	beforeChunkIds: new SyncHook(["chunks"]),
	optimizeChunkIds: new SyncHook(["chunks"]),
	afterOptimizeChunkIds: new SyncHook(["chunks"]),

	recordModules: new SyncHook(["modules", "records"]),
	recordChunks: new SyncHook(["chunks", "records"]),

	beforeHash: new SyncHook([]),
	afterHash: new SyncHook([]),

	recordHash: new SyncHook(["records"]),

	record: new SyncHook(["compilation", "records"]),

	beforeModuleAssets: new SyncHook([]),
	shouldGenerateChunkAssets: new SyncBailHook([]),
	beforeChunkAssets: new SyncHook([]),
	additionalChunkAssets: new SyncHook(["chunks"]),

	records: new SyncHook(["compilation", "records"]),

	additionalAssets: new AsyncSeriesHook([]),
	optimizeChunkAssets: new AsyncSeriesHook(["chunks"]),
	afterOptimizeChunkAssets: new SyncHook(["chunks"]),
	optimizeAssets: new AsyncSeriesHook(["assets"]),
	afterOptimizeAssets: new SyncHook(["assets"]),

	needAdditionalSeal: new SyncBailHook([]),
	afterSeal: new AsyncSeriesHook([]),

	chunkHash: new SyncHook(["chunk", "chunkHash"]),
	moduleAsset: new SyncHook(["module", "filename"]),
	chunkAsset: new SyncHook(["chunk", "filename"]),

	assetPath: new SyncWaterfallHook(["filename", "data"]), // TODO MainTemplate

	needAdditionalPass: new SyncBailHook([]),
	childCompiler: new SyncHook(["childCompiler", "compilerName", "compilerIndex"]),

	// TODO the following hooks are weirdly located here
	// TODO move them for webpack 5
	normalModuleLoader: new SyncHook(["loaderContext", "module"]),

	optimizeExtractedChunksBasic: new SyncBailHook(["chunks"]),
	optimizeExtractedChunks: new SyncBailHook(["chunks"]),
	optimizeExtractedChunksAdvanced: new SyncBailHook(["chunks"]),
	afterOptimizeExtractedChunks: new SyncHook(["chunks"]),
};

const normalModuleFactoryHooks = {
	resolver: new SyncWaterfallHook(["resolver"]),
	factory: new SyncWaterfallHook(["factory"]),
	beforeResolve: new AsyncSeriesWaterfallHook(["data"]),
	afterResolve: new AsyncSeriesWaterfallHook(["data"]),
	createModule: new SyncBailHook(["data"]),
	module: new SyncWaterfallHook(["module", "data"]),
	createParser: { isHookMap: true,  fn: new HookMap(() => new SyncBailHook(["parserOptions"])) },
	parser: { isHookMap: true, fn: new HookMap(() => new SyncHook(["parser", "parserOptions"])) },
};

const HooksMap = {
	normalModuleFactory: {
		createParser: ["javascript/auto", "javascript/dynamic", "javascript/esm"],
		parser: ["javascript/auto", "javascript/dynamic", "javascript/esm"],
	},
};

module.exports = {
	compilationHooks,
	compilerHooks,
	normalModuleFactoryHooks,
	HooksMap,
};
