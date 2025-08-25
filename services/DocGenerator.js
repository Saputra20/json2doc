/* eslint-disable no-await-in-loop */
/* eslint-disable security/detect-non-literal-fs-filename */
const { TemplateHandler } = require("easy-template-x");
const fs = require("fs");
const path = require("path");
const logger = require("../core/logger");

class DocGenerator {
  async generate(template, data, folder, filename) {
    logger.info(`Prepare template docx: ${path.resolve(folder, template)}`);
    const content = fs.readFileSync(path.resolve(folder, template));

    let doc;
    for (let loop = 0; loop < 6; loop++) {
      const handler = new TemplateHandler();
      doc = await handler.process(content, data);
    }
    const filepath = path.resolve(folder, `${filename}.docx`);

    fs.writeFileSync(filepath, doc);
    return filepath;
  }
}

module.exports = new DocGenerator();
