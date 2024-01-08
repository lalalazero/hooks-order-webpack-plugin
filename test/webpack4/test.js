const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const Plugin = require("log-runtime-hooks-order-webpack-plugin");
const { config: pluginConfig } = require("log-runtime-hooks-order-webpack-plugin");

const context = path.join(__dirname, "..", "fixture/js-node");
const config = require(context + "/webpack.config.js");


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

describe("webpack 4", () => {
  beforeAll(() => {
    try {
      console.log("remove dist directory...");
      fs.rmdirSync(path.join(context, "dist"));
    } catch (e) {}

    // try {
    //   const src = path.join(__dirname, "..", "fixture/js-node");
    //   const dest = __dirname
    //   fs.cpSync(src, dest, { recursive: true });
    // } catch (e) {}
  });
  Object.entries(testCases).forEach(([name, caseConfig]) => {
    it(`${name}`, (done) => {
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
