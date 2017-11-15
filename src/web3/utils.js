import bluebird from 'bluebird';
import web3Instance from './web3Provider';
import { defaultBlockNumber } from '../config';

/**
 * Check is address correct
 * @param address
 */
export const isAddress = address => web3Instance.isAddress(address);

/**
 * Return the eth network id for the current web3Instance
 * @returns integer
 */
const getEtherNetworkId = () => web3Instance.version.network;

export const getLastBlock = () => bluebird.promisify(web3Instance.eth.getBlockNumber)();

/**
 * Check if block number is correct by passing the last block number
 * in blockchain and the targeted block number
 * @param lastBlockNumber
 * @param blockNumber
 */
export const validateBlockNumber = async (blockNumber) => {
  if (blockNumber === defaultBlockNumber) return defaultBlockNumber;
  const lastBlockNumber = await getLastBlock();
  if (isNaN(blockNumber) || await lastBlockNumber < blockNumber) {
    throw new Error(`${blockNumber} is not valid block number last valid block is ${lastBlockNumber}`);
  }
  return blockNumber;
};

const web3Utils =
{
  isAddress,
  validateBlockNumber,
  getEtherNetworkId,
};

export default web3Utils;
