const chalk = require("chalk").default;
const ora = require("ora");
const logSymbols = require("log-symbols").default;

let spinner = null;

const logger = {
  start: (message) => {
    spinner = ora({
      text: message,
      color: "cyan",
    }).start();
  },

  succeed: (message) => {
    if (spinner) spinner.succeed(message);
    else console.log(logSymbols.success, chalk.green(message));
  },

  fail: (message) => {
    if (spinner) spinner.fail(message);
    else console.log(logSymbols.error, chalk.red(message));
  },

  warn: (message) => {
    if (spinner) spinner.warn(message);
    else console.log(logSymbols.warning, chalk.yellow(message));
  },

  info: (message) => {
    console.log(logSymbols.info, chalk.cyan(message));
  },

  plain: (message) => {
    console.log(chalk.gray(message));
  },

  stop: () => {
    if (spinner) spinner.stop();
  },
};

module.exports = logger;
