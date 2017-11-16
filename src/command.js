import program from 'commander';
import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';
import { defaultBlockNumber, watchingConfigPath, getEnv, saveStateFileName } from './config';
import { isAddress, validateBlockNumber } from './web3/utils';
import { isPathExist } from './utils';

/**
 * convert string to array
 * @param {string} val
 * @return Array
 */
const list = val => val.split(',');

/**
 * Handle input value priorities where ENV variable is higher in priority then config file
 * then default value
 * @param {string} envName
 * @return value
 */
const handelInputValues = (envName, fileInst, defaultValue) =>
  getEnv(envName) ? getEnv(envName) : fileInst || defaultValue;

/**
 * Validate address string based on web3.js function isAddress
 * then default value. should throw incase of error
 * @param {array} addresses
 * @return addresses
 */
const validateAddresses = (addresses) => {
  if (!addresses) throw new Error('-a or --address is required');
  addresses.forEach((address) => {
    if (!isAddress(address)) { throw new Error(`${address} is not valid address`); }
  });
  return addresses;
};

/**
 * Should throw if starting block is bigger than endblock while end block is not default
 * @param {integer} fromBlock
 * @param {integer} toBlock
 *
 */
const isBlockSmaller = (fromBlock, toBlock) => {
  if (toBlock !== defaultBlockNumber && fromBlock > toBlock) { throw new Error(`From "${fromBlock}" shouldn't be larger than "${toBlock}"`); }
};

/**
 * Create saveState file if it doesn't exist, read last Blockwritten in file if it exists
 * @param {integer} fromBlock
 * @param {integer} toBlock
 *
 */
const handleSaveSate = (saveStatePath, from) => {
  if (saveStatePath) {
    const lastBlockNumberFilePath = path.join(saveStatePath, saveStateFileName);

    if (!isPathExist(saveStatePath)) { fs.mkdirSync(saveStatePath); }
    if (!isPathExist(lastBlockNumberFilePath)) {
      fs.writeFileSync(lastBlockNumberFilePath, JSON.stringify({ blockNumber: from }));
      return from;
    }
    return (JSON.parse(fs.readFileSync(lastBlockNumberFilePath, { encoding: 'utf8' }))).blockNumber;
  }
  return null;
};

export default async (watchPath) => {
  const watchConfig = watchPath ? YAML.load(watchPath) : YAML.load(watchingConfigPath);
  program
    .version('0.1.0')
    .option('-a, --addresses [n]', 'List of address', list, handelInputValues('ADDRESSES', watchConfig.addresses, ''))
    .option('-f, --from [n]', 'From block', handelInputValues('FROM_BLOCK', watchConfig.from, defaultBlockNumber))
    .option('-t, --to [n]', 'To block', handelInputValues('TO_BLOCK', watchConfig.to, defaultBlockNumber))
    .option('-q, --quick [n]', 'Quick Mode', handelInputValues('QUICK_MODE', watchConfig.quick, true))
    .option('-s, --save-state [n]', 'Save state', handelInputValues('SAVE_STATE', watchConfig.saveState, null))
    .option('-n, --node-url [n]', 'Node address', handelInputValues('RPC_URL', watchConfig.node, 'http://localhost:8545'))
    .option('-l, --log-level [n]', 'Log level', handelInputValues('LOG_LEVEL', watchConfig.log_level, 'info'))
    .option('-p, --socket-port [n]', 'IO socket port number', handelInputValues('SOCKET_IO_PORT', watchConfig.socket, 3030))
    .option('-o,--output-type [n]', 'Output type', handelInputValues('OUTPUT_TYPE', watchConfig.outputType, 'terminal'))
    .option('-e,--access-token [n]', 'etherscan accssess token', handelInputValues('ACCESS_TOKEN', watchConfig.accessToken, ''))
    .parse(process.argv);

  if (typeof program === 'undefined') { throw new Error('No args are specifed in the command or in the .watch.yml file'); }

  const from = program.saveState ? handleSaveSate(program.saveState, program.from) : program.from;
  isBlockSmaller(from, program.to);
  return {
    from: await validateBlockNumber(from),
    to: await validateBlockNumber(program.to),
    addresses: validateAddresses(program.addresses),
    quickMode: program.quick,
    lastBlockNumberFilePath:
    program.saveState ? path.join(program.saveState, saveStateFileName) : null };
};
