import dotenv from 'dotenv';

dotenv.config();

export const getEnv = (variableName) => {
  if (typeof process.env[variableName] === 'undefined') { throw new Error('Enviroment variable is not eixsts'); }
  return process.env[variableName];
};

export const defaultBlockNumber = -1;

export const defaultFromBlockNumber = 0;

export const watchingConfigPath = '.watch.yml';

export const networksById = {
  1: 'api',
  3: 'ropsten',
  4: 'rinkeby',
  42: 'kovan',
};
