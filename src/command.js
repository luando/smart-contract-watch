import program from 'commander';
import fs from 'fs';
import path from 'path';
import YAML from 'yamljs';
import { defaultBlockNumber, watchingConfigPath, getEnv } from './config';
import { isAddress, validateBlockNumber, getLastBlock } from './web3/utils';
import { isPathExist } from './utils';

/**
 * convert string to array
 * @param {string} val
 * @return Array
 */
const list = val => val.split(',');

const handelInputValues = (envName, fileInst, defaultValue) =>
  getEnv(envName) ? getEnv(envName) : fileInst || defaultValue;

const validateAddresses = (addresses) => {
  addresses.forEach((address) => {
    if (!isAddress(address)) { throw new Error(`${address} is not valid address`); }
  });
  return addresses;
};

const isBlockSmaller = (from, to) => {
  if (to !== defaultBlockNumber && from > to) { throw new Error(`From "${from}" shouldn't be larger than "${to}"`); }
  return from;
};

export default async () => {
  const watchConfig = YAML.load(watchingConfigPath);
  program
    .version('0.1.0')
    .option('-a, --addresses <n>', 'List of address', list)
    .option('-f, --from [n]', 'From block', handelInputValues('FROM_BLOCK', watchConfig.from, defaultBlockNumber))
    .option('-t, --to [n]', 'To block', handelInputValues('TO_BLOCK', watchConfig.to, defaultBlockNumber))
    .option('-q, --quick [n]', 'Quick Mode', handelInputValues('QUICK_MODE', watchConfig.quick, false))
    .option('-s, --save-state [n]', 'Save state', handelInputValues('SAVE_STATE', watchConfig.saveState, false))
    .option('-n, --node-url [n]', 'Node address', handelInputValues('RPC_URL', watchConfig.node, 'http://localhost:8545'))
    .option('-l, --log-level [n]', 'Log level', handelInputValues('LOG_LEVEL', watchConfig.log_level, 'info'))
    .option('-p, --socket-port [n]', 'IO socket port number', handelInputValues('SOCKET_IO_PORT', watchConfig.socket, 3030))
    .option('-o,--output-type [n]', 'Output type', handelInputValues('OUTPUT_TYPE', watchConfig.outputType, 'terminal'))
    .option('-e,--access-token [n]', 'etherscan accssess token', handelInputValues('ACCESS_TOKEN', watchConfig.accessToken, ''))
    .parse(process.argv);

  if (typeof program === 'undefined') { throw new Error('No args are specifed in the command or in the .watch.yml file'); }

  let from = program.from;
  const saveStatePath = program.saveState;
  let lastBlockNumberFilePath = null;
  // TODO: clear save state handeling and make it better
  if (saveStatePath) {
    lastBlockNumberFilePath = path.join(saveStatePath, 'last-block-number.json');

    if (!isPathExist(saveStatePath)) {
      fs.mkdirSync(saveStatePath);
    }

    if (!isPathExist(lastBlockNumberFilePath)) {
      fs.writeFileSync(lastBlockNumberFilePath, JSON.stringify({ blockNumber: from }));
    } else {
      const lastBlockNumberJson = JSON.parse(fs.readFileSync(lastBlockNumberFilePath,
        { encoding: 'utf8' }));
      from = lastBlockNumberJson.blockNumber;
    }
  }
  isBlockSmaller(from, program.to);
  return {
    from: await validateBlockNumber(from),
    to: await validateBlockNumber(program.to),
    addresses: validateAddresses(program.addresses),
    quickMode: program.quick,
    lastBlockNumberFilePath };
};
