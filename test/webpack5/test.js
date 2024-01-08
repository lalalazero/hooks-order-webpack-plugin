const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const Plugin = require("log-runtime-hooks-order-webpack-plugin");
const {
  config: pluginConfig,
} = require("log-runtime-hooks-order-webpack-plugin");

const context = path.join(__dirname, "src");

const testCases = Object.keys(pluginConfig).reduce(
  (acc, cur) => ({
    ...acc,
    [cur]: {
      output: cur,
      plugins: [new Plugin({ verbose: false, [cur]: true, silent: true })],
    },
  }),
  {}
);

testCases.all = {
  output: "all",
  plugins: [new Plugin({ silent: true })],
};

function cleanupSrc() {
  try {
    fs.rmdirSync(context, { force: true, recursive: true });
  } catch (e) {}
}

function copyFixture() {
  try {
    const src = path.join(__dirname, "..", "fixture/js-node");
    fs.cpSync(src, context, { recursive: true });
  } catch (e) {}
}

beforeAll(() => {
  cleanupSrc();
  copyFixture();
});

describe("webpack 5 latest", () => {
  Object.entries(testCases).forEach(([name, caseConfig]) => {
    it(`${name}`, (done) => {
      const config = require(context + "/webpack.config.js");
      const compiler = webpack({
        context,
        ...config,
        output: {
          ...config.output,
          path: path.join(context, "dist", caseConfig.output),
        },
        plugins: [...config.plugins, ...caseConfig.plugins],
      });

      compiler.run(() => {
        console.log(`${name} test case build done`);
        done();
      });
    });
  });
});
