import loggerInit, { logError } from './logger';
import { initCommands } from './command';
import Decoder from './decoder';
import JsonRpc from './jsonrpc';
import { getABI } from './etherscan';
import output from './output';
import { isContractCreationTransaction } from './utils';

/**
 *
 * 1- Get smart contract ABI from etherscan
 * 2- Store smart contract ABI locally
 * 3- Get transactions from ledger
 * 4- Decode transactions/logs asynchronously
 * 5- Send final data into output module
 *
 */

/**
 * Decode a transaction and all logs generated from it then send results to output model
 * @param {*} transaction
 */

const addressAbiMap = {};
let variableClass;
let logger;

const transactionHandler = async (transaction) => {
  let decodedLogs;
  let decodedInputDataResult;
  if (isContractCreationTransaction(transaction.to)) {
    try {
      decodedInputDataResult = addressAbiMap[transaction.contractAddress]
        .decodeConstructor(transaction.input);
      decodedLogs = null;
    } catch (error) {
      logError(`txHash: ${transaction.hash} ${error.message}`, variableClass.outputType);
    }
  } else {
    try {
      decodedInputDataResult = addressAbiMap[transaction.to].decodeMethod(transaction.input);
    } catch (error) {
      logError(`txHash: ${transaction.hash} ${error.message}`, variableClass.outputType);
    }

    try {
      decodedLogs = addressAbiMap[transaction.to].decodeLogs(transaction.logs);
    } catch (error) {
      logError(`txHash: ${transaction.hash} ${error.message}`, variableClass.outputType);
    }
  }
  output({ transaction, decodedInputDataResult, decodedLogs }, variableClass.outputType);
};


/**
 * The main function that has the full steps
 */
const main = async () => {
  try {
    // @TODO: find a solution for variable handeling
    variableClass = await initCommands();
    logger = loggerInit(variableClass.logLevel);
    console.log(logger);
    logger.debug('Start process');

    const PromisifiedAbiObjects = variableClass.addresses.map(async address => (
      { address, abi: await getABI(address, variableClass) }
    ));

    (await Promise.all(PromisifiedAbiObjects)).forEach((object) => {
      addressAbiMap[object.address.toLowerCase()] = new Decoder(object.abi);
    });

    const jsonRpc = new JsonRpc(variableClass.addresses,
      variableClass.from, variableClass.to,
      variableClass.lastBlockNumberFilePath, logger,
      transactionHandler);

    await jsonRpc.scanBlocks(variableClass.quickMode);
    logger.info('Finish scanning all the blocks');
  } catch (e) {
    console.log(e);
    logError(e);
  }
};

main().catch((e) => {
  console.log(e);
  logError(e);
});
