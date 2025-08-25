const path = require("path");
const fs = require("fs");
const logger = require("../core/logger");
const {
  resolveRef,
  mappingParameters,
  mappingResponses,
  mappingHeaders,
  mappingBody,
} = require("../core/utils");
const docGeneratorService = require("../services/DocGenerator");

const generator = async (baseName, options) => {
  try {
    switch (options.platform) {
      case "postman":
        break;

      default:
        swagger(baseName, options);
        break;
    }
  } catch (error) {
    logger.fail(`Failed to convert files: ${error.message}`);
  }
};

const swagger = async (baseName, options) => {
  try {
    const swaggerPath = path.join(process.cwd(), baseName);
    const targetFilePath = path.join(
      process.cwd(),
      options.output.replace(".docx", "")
    );

    const raw = fs.readFileSync(swaggerPath, "utf8");
    const swaggerData = JSON.parse(raw);

    const array = [];

    for (const path of Object.entries(swaggerData.paths)) {
      const [endpoint, details] = path;
      for (const detail of Object.entries(details)) {
        const [method, detailData] = detail;

        const headers = [];
        if (detailData.security) {
          for (const security of detailData.security) {
            headers.push({
              value: mappingHeaders(security),
            });
          }
        }

        const parameters = [];
        if (detailData.parameters) {
          for (const parameter of detailData.parameters) {
            parameters.push({
              value: mappingParameters(resolveRef(parameter.$ref, swaggerData)),
            });
          }
        }

        let body = null;
        if (detailData.requestBody) {
          if (detailData.requestBody.content["application/json"]) {
            body = JSON.stringify(
              mappingBody(
                resolveRef(
                  detailData.requestBody.content["application/json"].schema
                    .$ref,
                  swaggerData
                )
              ),
              null,
              2
            );
          }
        }

        const responses = [];
        if (detailData.responses) {
          for (const responseArray of Object.entries(detailData.responses)) {
            const [statusCode, responseDetail] = responseArray;

            if (responseDetail.content) {
              responses.push({
                statusCode,
                description: responseDetail.description,
                content: JSON.stringify(
                  mappingResponses(
                    resolveRef(
                      responseDetail.content["application/json"].schema.$ref,
                      swaggerData
                    )
                  ),
                  null,
                  2
                ),
              });
            }
          }
        }

        const isExist = array.find(
          (item) => item.module === detailData.tags[0]
        );

        if (isExist) {
          isExist.apis.push({
            endpoint: `{baseUrl}/api${endpoint}`,
            method: method.toUpperCase(),
            name: detailData.summary,
            description: detailData.description,
            headers,
            isHeaders: headers.length > 0 ? true : false,
            parameters,
            isParameters: parameters.length > 0 ? true : false,
            responses,
            isResponses: responses.length > 0 ? true : false,
            body,
            isBody: body ? true : false,
          });
        } else {
          array.push({
            module: detailData.tags[0],
            apis: [
              {
                endpoint: `{baseUrl}/api${endpoint}`,
                method: method.toUpperCase(),
                name: detailData.summary,
                description: detailData.description,
                headers,
                isHeaders: headers.length > 0 ? true : false,
                parameters,
                isParameters: parameters.length > 0 ? true : false,
                responses,
                isResponses: responses.length > 0 ? true : false,
                body,
                isBody: body ? true : false,
              },
            ],
          });
        }
      }
    }

    let templateFile = "template.docx";
    let templateDir = "./templates/";
    if (options.template) {
      templateFile = options.template;
      templateDir = path.join(process.cwd());
    }

    await docGeneratorService.generate(
      templateFile,
      { array },
      templateDir,
      targetFilePath
    );
  } catch (error) {
    logger.fail(`Failed to convert files: ${error.message}`);
  }
};

module.exports = generator;
