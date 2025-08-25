#!/usr/bin/env node
const { Command, Option } = require("commander");
const program = new Command();
const { version } = require("../package.json");
const generator = require("../commands/generator");

program
  .name("json2doc")
  .description("Generator for json to DOCX files")
  .version(version);

program
  .command("convert")
  .alias("c")
  .description("Convert json file to DOCX")
  .argument("<input>", "Path to swagger/openapi JSON file")
  .addOption(
    new Option("--platform <platform>", "Target platform").choices([
      "swagger",
      "postman",
    ])
  )
  .option("--output <file>", "Output DOCX path", "api-docs.docx")
  .option("--template <file>")
  .action(generator);

program.parse();
