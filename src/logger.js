import winston from 'winston';

const logger = (logLevel) => {
  const loggerConsoleOptions = {
    timestamp: false,
    level: logLevel,
    colorize: false,
    formatter: options => `${options.message}`,
  };
  return new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(loggerConsoleOptions),
    ] });
};
/**
 * This will print out the error as json formatted
 * @param {*} error
 * @param {*} customMessage
 */
export const logError = (error, customMessage = null, isStack = true, outputType) => {
  switch (outputType) {
    case 'terminal':
      logger.error(error.message);
      logger.error(error.stack);
      break;
    case 'graylog':
    default:
      logger.error(JSON.stringify({ type: 'Error',
        message: error.message,
        stack: isStack ? error.stack : null,
        customMessage }));
      break;
  }
};

export default logger;
