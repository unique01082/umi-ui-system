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
        return joi.object();
      },
      onChange: api.ConfigChangeType.regenerateTmpFiles,
    },
    enableBy: api.EnableBy.config,
  });

  api.addRuntimePluginKey(() => ["uiSystem"]);

  let libInstalled = api.pkg.dependencies?.["react-twilight"];
  if (libInstalled) {
    api.logger.info("react-twilight found.");
  } else {
    api.logger.info(
      "react-twilight not found. Skipping generating Box component."
    );
  }

  api.onGenerateFiles(async (...args) => {
    api.writeTmpFile({
      path: "index.ts",
      content: `import React from 'react';
import {SystemUiContext} from './context';
${
  libInstalled
    ? `
import {
  addAllStyles,
  addAllSelectors,
  addAllVariants,
  addAllCsses,
  createVariantParser,
  createStyleParser,
  parsersManager,
  withTwilight,
} from 'react-twilight';

addAllStyles();
addAllSelectors();
addAllVariants();
addAllCsses();

const fontSizeVariantParser = createVariantParser('textSize');
const objectFitStyleParser = createStyleParser('objectFit');

parsersManager.add(fontSizeVariantParser);
parsersManager.add(objectFitStyleParser);

export const Box = withTwilight('div');
`
    : ""
}

export const useSystemUi = () => {
  return React.useContext(SystemUiContext);
};

export const ColorPalette = ${JSON.stringify(
        api.userConfig.uiSystem.colorPalette,
        null,
        2
      )};

      `,
    });

    api.writeTmpFile({
      path: "variables.less",
      content: Object.entries(api.userConfig.uiSystem.colorPalette)
        .map((entry) => `@${entry[0]}: ${entry[1]};`)
        .join("\n"),
    });

    api.writeTmpFile({
      path: "runtime.tsx",
      content: `import React from 'react';
import { SystemUiContext } from './context';
import { ThemeProvider } from 'react-twilight';

function Provider(props) {
  return (
    <SystemUiContext.Provider value={{a: 1}}>
      ${
        libInstalled
          ? `<ThemeProvider theme={${JSON.stringify(
              api.userConfig.uiSystem,
              null,
              2
            )}}>`
          : ""
      }
        { props.children }
      ${libInstalled ? `</ThemeProvider>` : ""}
    </SystemUiContext.Provider>
  );
}

export function outerProvider(container) {
  return <Provider>{ container }</Provider>;
}
      `,
    });

    api.writeTmpFile({
      path: "context.ts",
      content: `import React from 'react';

export const SystemUiContext = React.createContext<any>(null);
      `,
    });

    api.writeTmpFile({
      path: "context.ts",
      content: `import React from 'react';

export const SystemUiContext = React.createContext<any>(null);
`,
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

  api.addRuntimePlugin(() => [withTmpPath({ api, path: "runtime.tsx" })]);

  if (libInstalled) {
    api.logger.ready(
      "Box component generated! import { Box } from '@umijs/max'"
    );
  }
  api.logger.ready("UI system generated!");
  api.logger.info(
    `${"import { ColorPalette } from '@umijs/max'"} OR ${"@import '.umi/plugin-uiSystem/variables.less'"}`
  );
};
