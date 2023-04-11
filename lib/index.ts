import { winPath } from "@umijs/utils";
import { dirname, join } from "path";
import { IApi } from "umi";

export default (api: IApi) => {
  api.describe({
    key: "uiSystem",
    config: {
      schema(joi) {
        return joi.object();
      },
      onChange: api.ConfigChangeType.regenerateTmpFiles,
    },
    enableBy: api.EnableBy.config,
  });

  api.addRuntimePluginKey(() => ["uiSystem"]);

  api.onGenerateFiles(async (...args) => {
    api.writeTmpFile({
      path: "index.ts",
      content: `
      export const ColorPalette = ${JSON.stringify(
        api.userConfig.uiSystem.colorPalette,
        null,
        2
      )};

      `,
    });
  });

  api.onGenerateFiles(async (...args) => {
    api.writeTmpFile({
      path: "variables.less",
      content: Object.entries(api.userConfig.uiSystem.colorPalette)
        .map((entry) => `@${entry[0]}: ${entry[1]};`)
        .join("\n"),
    });
  });

  api.addHTMLStyles(
    () => `
    :root {
      ${Object.entries(api.userConfig.uiSystem.colorPalette)
        .map((entry) => `--${entry[0]}: ${entry[1]};`)
        .join("\n\t\t")}
    }
  `
  );

  api.logger.ready("UI system generated!");
  api.logger.info(
    `${"import { ColorPalette } from '@umijs/max'"} OR ${"@import '.umi/plugin-uiSystem/variables.less'"}`
  );
};
