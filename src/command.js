import program from 'commander';
import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';
import { defaultBlockNumber, watchingConfigPath, getEnv, saveStateFileName } from './config';
import { isAddress, getLastBlock } from './web3/utils';
import { isPathExist } from './utils';

/**
 * convert string to array
 * @param {string} val
 * @return Array
 */
const list = val => val.split(',');


export class Commands {
  constructor(watchPath, lastBlockNumber) {
    const watchConfig = watchPath ? YAML.load(watchPath) : YAML.load(watchingConfigPath);
    program
      .version('0.1.0')
      .option('-a, --addresses [n]', 'List of address', list, Commands.handelInputValues('ADDRESSES', watchConfig.addresses, ''))
      .option('-f, --from [n]', 'From block', Commands.handelInputValues('FROM_BLOCK', watchConfig.from, 0))
      .option('-t, --to [n]', 'To block', Commands.handelInputValues('TO_BLOCK', watchConfig.to, defaultBlockNumber))
      .option('-q, --quick [n]', 'Quick Mode', Commands.handelInputValues('QUICK_MODE', watchConfig.quick, true))
      .option('-s, --save-state [n]', 'Save state', Commands.handelInputValues('SAVE_STATE', watchConfig.saveState, null))
      .option('-n, --node-url [n]', 'Node address', Commands.handelInputValues('RPC_URL', watchConfig.node, 'http://localhost:8545'))
      .option('-l, --log-level [n]', 'Log level', Commands.handelInputValues('LOG_LEVEL', watchConfig.log_level, 'info'))
      .option('-p, --socket-port [n]', 'IO socket port number', Commands.handelInputValues('SOCKET_IO_PORT', watchConfig.socket, 3030))
      .option('-o,--output-type [n]', 'Output type', Commands.handelInputValues('OUTPUT_TYPE', watchConfig.outputType, 'terminal'))
      .option('-e,--access-token [n]', 'etherscan accssess token', Commands.handelInputValues('ACCESS_TOKEN', watchConfig.accessToken, ''))
      .parse(process.argv);

    if (typeof program === 'undefined') { throw new Error('No args are specifed in the command or in the .watch.yml file'); }
    // TODO: add validation to all parameters
    this.to = Commands.validateBlock(program.to, lastBlockNumber);
    this.from = Commands.validateBlock(program.from, program.to);
    this.addresses = Commands.validateAddresses(program.addresses);
    this.quickMode = program.quick;
    this.lastBlockNumberFilePath =
      program.saveState ? Commands.handleSaveSate(program.saveState, program.from) : program.from;
    this.node = program.nodeUrl;
    this.logLevel = program.logLevel;
    this.socketPort = program.socketPort;
    this.outputType = program.outputType;
    this.accessToken = program.accessToken;
    this.saveState =
      program.saveState ? Commands.handleSaveSate(program.saveState, program.from) : program.from;
  }

  /**
   * Handle input value priorities where ENV variable is higher in priority then config file
   * then default value
   * @param {string} envName
   * @return value
   */
  static handelInputValues(envName, fileInst, defaultValue) {
    return getEnv(envName) ? getEnv(envName) : fileInst || defaultValue;
  }

  /**
   * Create saveState file if it doesn't exist, read last Blockwritten in file if it exists
   * @param {integer} fromBlock
   * @param {integer} toBlock
   *
   */
  static handleSaveSate(saveStatePath, from) {
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
  }


  /**
   * Validate address string based on web3.js function isAddress
   * then default value. should throw incase of error
   * @param {array} addresses
   * @return addresses
   */
  static validateAddresses(addresses) {
    if (!addresses) throw new Error('-a or --address is required');
    addresses.forEach((address) => {
      if (!isAddress(address)) { throw new Error(`${address} is not valid address`); }
    });
    return addresses;
  }

  /**
   * Should throw if starting block is bigger than endblock while end block is not default
   * @param {integer} fromBlock
   * @param {integer} toBlock
   *
   */
  static validateBlock(fromBlock, endBlock) {
    if (endBlock === defaultBlockNumber) return fromBlock;
    if (isNaN(fromBlock) || endBlock < fromBlock) {
      throw new Error(`${fromBlock} is not valid block number last valid block is ${endBlock}`);
    }
    return fromBlock;
  }
}

export const initCommands = async (watchPath) => {
  const lastBlockNumber = await getLastBlock();
  return new Commands(watchPath, lastBlockNumber);
};

export default initCommands;
