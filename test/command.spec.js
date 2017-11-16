import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';
import web3 from '../src/web3/web3Provider';

chai.use(chaiAsPromised);
chai.should();

let command;
const lastBlockNumber = Number.MAX_SAFE_INTEGER;
const getBlockNumber = (callback) => {
  if (callback) { callback(null, Number.MAX_SAFE_INTEGER); }
};
const watchPath = 'test/mockedData/.watch.yml';

describe('Command read input from terminal', () => {
  let processArgv;
  beforeEach(() => {
    processArgv = process.argv;
    process.argv = [
      'node',
      'dist'];
    delete require.cache[require.resolve('commander')];
    delete require.cache[require.resolve('../src/command')];
    command = require('../src/command').default;
    sinon.stub(web3.eth, 'getBlockNumber').withArgs().callsFake(getBlockNumber);
  });

  afterEach(() => {
    process.argv = processArgv;
    web3.eth.getBlockNumber.restore();
    process.on('unhandledRejection', (error) => {
      // Will print "unhandledRejection err is not defined"
      console.log(error);
    });
  });

  it('Should raise error when from is greater than to', () => {
    const from = 4240720;
    const to = 4240705;
    process.argv = process.argv.concat(['-f',
      from,
      '-t',
      to,
      '-a',
      '0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724']);
    command(watchPath).should.be.rejectedWith(`From "${from}" shouldn't be larger than "${to}"`);
  });

  it('Should raise error when there\'s invalid address', () => {
    const addresses = '0x2c974b2d0ba1716e644c1fc59982a89ddd2ff74';
    const from = 4240720;
    const to = 4240735;

    process.argv = process.argv.concat(['-f',
      from,
      '-t',
      to,
      '-a',
      addresses]);
    command(watchPath).should.be.rejectedWith(`${addresses} is not valid address`);
  });

  it('Should assign the values correctly when there\'s many addreses', () => {
    const inputAddresses = '0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724,0xa74476443119A942dE498590Fe1f2454d7D4aC0d';
    const from = 4240705;
    const to = 4240720;
    const quickMode = true;
    const lastBlockNumberFilePath = null;
    process.argv = process.argv.concat(['-f',
      from,
      '-t',
      to,
      '-a',
      inputAddresses]);

    // const program = command(watchPath, lastBlockNumber);
    const addresses = ['0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724', '0xa74476443119A942dE498590Fe1f2454d7D4aC0d'];
    command(watchPath).should.eventually.deep.equal(
      { from, to, addresses, quickMode, lastBlockNumberFilePath });
  });

  it('Should assign the values correctly', () => {
    const inputAddresses = '0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724';
    const from = 4240705;
    const to = 4240720;
    const quickMode = true;
    const lastBlockNumberFilePath = null;

    process.argv = process.argv.concat(['-f',
      from,
      '-t',
      to,
      '-a',
      inputAddresses]);

    const addresses = ['0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724'];
    command(watchPath).should.eventually.deep.equal(
      { from, to, addresses, quickMode, lastBlockNumberFilePath });
  });
});

describe('Command read input config file', () => {
  let processArgv;
  beforeEach(() => {
    processArgv = process.argv;
    process.argv = [
      'node',
      'dist'];
    delete require.cache[require.resolve('commander')];
    delete require.cache[require.resolve('../src/command')];
    command = require('../src/command').default;
    sinon.stub(web3.eth, 'getBlockNumber').withArgs().callsFake(getBlockNumber);
  });

  afterEach(() => {
    process.argv = processArgv;
    web3.eth.getBlockNumber.restore();
  });


  it('Should return the expected values from config file correctly', () => {
    // expected result
    const from = 3917867;
    const to = 4240720;
    const addresses = ['0xda7c27c04f66842faf20644814b644e25e1766ea'];
    const quickMode = true;
    const lastBlockNumberFilePath = null;
    command(watchPath).should.eventually.deep.equal(
      { from, to, addresses, quickMode, lastBlockNumberFilePath });
  });

  it('Should return the from value from the input and the rest from the config file', () => {
    process.argv = process.argv.concat([
      '-f',
      3917869,
    ]);

    // expected result
    const from = 3917869;
    const to = 4240720;
    const quickMode = true;
    const lastBlockNumberFilePath = null;

    const addresses = ['0xda7c27c04f66842faf20644814b644e25e1766ea'];
    command(watchPath).should.eventually.deep.equal(
      { from, to, addresses, quickMode, lastBlockNumberFilePath });
  });

  it('Should return the addresses value from the input and the rest from the config file', () => {
    process.argv = process.argv.concat([
      '-a',
      '0x91c94bee75786fbbfdcfefba1102b68f48a002f4',
    ]);
    const lastBlockNumberFilePath = null;

    // expected result
    const from = 3917867;
    const to = 4240720;
    const addresses = ['0x91c94bee75786fbbfdcfefba1102b68f48a002f4'];
    const quickMode = true;
    command(watchPath).should.eventually.deep.equal(
      { from, to, addresses, quickMode, lastBlockNumberFilePath });
  });

  it('Should fail when there\'s no address in the config or in the input', () => {
    const emptyWatchPath = 'test/mockedData/.watch.empty.yml';
    command(emptyWatchPath).should.be.rejectedWith('-a or --address is required');
  });
});


describe('Test lastBlockNumberFilePath', () => {
  let processArgv;
  const testDirectory = '/tmp/block-number-testing';
  const testedPath = path.join(testDirectory, 'last-block-number.json');

  beforeEach(() => {
    processArgv = process.argv;
    process.argv = [
      'node',
      'dist'];
    delete require.cache[require.resolve('commander')];
    delete require.cache[require.resolve('../src/command')];
    command = require('../src/command').default;


    if (fs.existsSync(testedPath)) {
      fs.unlinkSync(testedPath);
    }
    if (fs.existsSync(testDirectory)) {
      fs.rmdirSync(testDirectory);
    }
  });

  afterEach(() => {
    process.argv = processArgv;

    if (fs.existsSync(testedPath)) {
      fs.unlinkSync(testedPath);
    }
    if (fs.existsSync(testDirectory)) {
      fs.rmdirSync(testDirectory);
    }
  });

  it('Should create new file when there\'s file ', async () => {
    process.argv = process.argv.concat([
      '-a',
      '0x91c94bee75786fbbfdcfefba1102b68f48a002f4',
      '-s',
      testDirectory,
    ]);
    // test when file is not exists
    await command(watchPath);
    chai.expect(fs.existsSync(testedPath)).to.be.equal(true);

    // test when file Already exists
    await command(watchPath);
    chai.expect(fs.existsSync(testedPath)).to.be.equal(true);
  });
});
