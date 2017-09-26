import blockTemplate from './mockedData/block';
import transactionReceiptTemplate from './mockedData/transactionReceipt';

export default {
    eth: {
        getBlock: (blockNumber, transactions, callback) => {
            if (callback)
                callback(null, blockTemplate)
        },
        getTransactionReceipt: (transaction, callback) => {
            if (callback)
                callback(null, transactionReceiptTemplate)
        }
    }
};
