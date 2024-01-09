const getWebpack = (version) => {
  const webpack4_alpha = require("webpack4-alpha");
  const webpack4_latest = require("webpack4");
  const webpack5_latest = require("webpack5");
  const map = {
    v4_alpha: webpack4_alpha,
    v4: webpack4_latest,
    v5: webpack5_latest,
  };

  return map[version];
};

const fs = require("fs");
const path = require("path");
const Plugin = require("log-runtime-hooks-order-webpack-plugin");
const {
  config: pluginConfig,
} = require("log-runtime-hooks-order-webpack-plugin");

function genPlugins(version = 4) {
  const defaultPlugins = Object.keys(pluginConfig).map(
    (name) =>
      new Plugin(
        {
          verbose: false,
          silent: true,
          [name]: true,
          filename: `${name}.txt`,
        },
        version
      )
  );
  defaultPlugins.push(new Plugin({ verbose: true, silent: true }, version));

  return defaultPlugins;
}

const testSuites = [
  {
    name: "webpack 4 alpha",
    version: "v4_alpha",
    plugins: genPlugins(),
  },
  {
    name: "webpack 4 latest",
    version: "v4",
    plugins: genPlugins(),
  },
  {
    name: "webpack 5 latest",
    version: "v5",
    plugins: genPlugins(5),
  },
];

const FIXTURES = [
  "js-node",
  "js-bear"
];

FIXTURES.forEach(testFixture)

function testFixture(fixture) {
  const context = path.join(__dirname, "fixture", fixture);

  beforeAll(() => {
    try {
      fs.rmdirSync(path.join(context, "dist"), { recursive: true });
    } catch (e) {}
  });

  describe("fixture " + fixture, () => {
    runTestSuites(context);
  });
}

function runTestSuites(context) {
  testSuites.forEach((testSuit) => {
    describe(testSuit.name, () => {
      it(`should generate runtime hooks order`, (done) => {
        const webpackConfig = require(context + "/webpack.config.js");
        const compiler = getWebpack(testSuit.version)({
          context,
          ...webpackConfig,
          output: {
            ...webpackConfig.output,
            path: path.join(context, "dist", testSuit.version),
          },
          plugins: [...webpackConfig.plugins, ...testSuit.plugins],
        });

        compiler.run(() => {
          done();
        });
      });
    });
  });
}
