import { IApi } from "umi";
import { winPath } from "umi/plugin-utils";

function withTmpPath(opts: { api: IApi; path: string; noPluginDir?: boolean }) {
  return winPath(
    `${
      opts.api.paths.absTmpPath
    }/plugin-${`${opts.api.plugin.key}/${opts.path}`}`
  );
}

export default (api: IApi) => {
  api.describe({
    key: "uiSystem",
    config: {
      schema(joi) {
        return joi.object({
          theme: joi.object(),
          setup: joi.function(),
        });
      },
      onChange: api.ConfigChangeType.regenerateTmpFiles,
    },
    enableBy: api.EnableBy.config,
  });

  api.addRuntimePluginKey(() => ["setupUISystem"]);

  let libInstalled = api.pkg.dependencies?.["react-twilight"];
  if (!libInstalled) {
    api.logger.info(
      "react-twilight not found. Skipping generating Box component."
    );
  }

  api.onGenerateFiles(async () => {
    api.writeTmpFile({
      path: "index.ts",
      content: `${
        libInstalled
          ? `
        import * as rt from 'react-twilight';
        import { setupUISystem } from '@/app';

        setupUISystem(rt);

        export const theme = ${JSON.stringify(
          api.userConfig.uiSystem.theme,
          null,
          2
        )};

        export const ColorPalette = theme.colorPalette;
`
          : ""
      }

      `,
    });

    api.writeTmpFile({
      path: "variables.less",
      content: Object.entries(api.userConfig.uiSystem.theme.colorPalette)
        .map((entry) => `@${entry[0]}: ${entry[1]};`)
        .join("\n"),
    });

    api.writeTmpFile({
      path: "runtime.tsx",
      content: `import { theme } from '.';
import { ThemeProvider } from 'react-twilight';

function Provider(props) {
  return (
    ${libInstalled ? `<ThemeProvider theme={theme}>` : ""}
      {props.children}
    ${libInstalled ? `</ThemeProvider>` : ""}
  );
}

export function outerProvider(container) {
  return <Provider>{container}</Provider>;
}
`,
    });
  });

  api.onDevCompileDone(async (opts) => {
    if (opts.isFirstCompile) {
      const rt = await import("react-twilight");

      api.userConfig.uiSystem.setup(rt);

      const { parsersManager } = rt;

      const snapshot = Array.from(parsersManager).reduce((acc, t: any) => {
        t.propNames.forEach((propName: any) => {
          acc.set(propName, t.scaleName);
        });

        return acc;
      }, new Map());

      const replacer = (_key: string, value: any) =>
        typeof value === "undefined" ? null : value;

      api.writeTmpFile({
        path: "static.ts",
        content: `export type ParsersManagerSupportedKeysSnapshot = ${JSON.stringify(
          Object.fromEntries(snapshot),
          replacer,
          2
        )};

        export const parsersManagerSupportedKeysSnapshot: ParsersManagerSupportedKeysSnapshot = ${JSON.stringify(
          Object.fromEntries(snapshot),
          replacer,
          2
        )};`,
      });
    }
  });

  api.addHTMLStyles(
    () => `
    :root {
      ${Object.entries(api.userConfig.uiSystem.theme.colorPalette)
        .map((entry) => `--${entry[0]}: ${entry[1]};`)
        .join("\n\t\t")}
    }
  `
  );

  api.addRuntimePlugin(() => [withTmpPath({ api, path: "runtime.tsx" })]);

  api.logger.ready("UI system generated!");
  api.logger.info(
    `${"import { ColorPalette } from '@umijs/max'"} OR ${"@import '.umi/plugin-uiSystem/variables.less'"}`
  );
};
