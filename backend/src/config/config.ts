import * as devConfig from "./config.dev.json";
import * as prodConfig from "./config.prod.json";

type ConfigType = typeof devConfig | typeof prodConfig;

export enum PossibleNodeEnvs {
  local = "local",
  production = "production",
}
export const EnvVars = loadEnvironmentVars();
class Config {
  environmentConfig: ConfigType;

  constructor() {
    const environment = EnvVars.NodeEnv;
    let config: ConfigType;
    switch (environment) {
      case PossibleNodeEnvs.production:
        config = prodConfig;
        break;

      default:
        config = devConfig;
        break;
    }

    if (!config) {
      // TODO: create uniform application errors
      throw new Error("Invalid config file");
    }

    this.environmentConfig = config;
  }
}

function loadEnvironmentVars() {
  console.info(`* Loading environment variables..`);

  // Read environment variables
  let NodeEnv = process.env.NODE_ENV;
  // Validate env file
  let validEnvironmentVariables = true;
  const getEnvVarRequiredError = (envVarName) =>
    `  ERROR: "${envVarName}" is a required environment variable. `;
  const getEnvVarDefaultWarning = (envVarName, defaultVal) =>
    `  WARNING: "${envVarName}" was not found in environment variable file. Default value "${defaultVal}" is used instead.`;

  if (!NodeEnv) {
    NodeEnv = "local";
    console.warn(getEnvVarDefaultWarning("NODE_ENV", NodeEnv));
  }
  if (!validEnvironmentVariables) {
    process.exit();
  }
  console.info(`* .. Environment vairables loaded`);
  // Return environment variables in a readonly object
  return Object.freeze({
    NodeEnv: process.env.NODE_ENV as string,
  });
}

export const config = new Config();
