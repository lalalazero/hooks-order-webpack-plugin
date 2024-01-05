const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const Plugin = require("log-runtime-hooks-order-webpack-plugin");

const context = path.join(__dirname, "..", "fixture/js-node");
const config = require(context + "/webpack.config.js");

const testCases = {
  compiler: {
    output: "compiler",
    plugins: [new Plugin({ compiler: true })],
  },
};

beforeAll(() => {
  debugger
  try {
    fs.rmdirSync(path.join(context, "dist"));
  } catch (e) {}
});

describe("webpack 4", () => {
  Object.entries(testCases).forEach(([name, caseConfig]) => {
    it(`${name}`, () => {
      const compiler = webpack({
        context,
        ...config,
        output: {
          ...config.output,
          path: path.join(context, caseConfig.output),
        },
        plugins: [...config.plugins, ...caseConfig.plugins],
      });

      compiler.run(() => {
        console.log(`${name} test case build done`);
      });
    });
  });
});
