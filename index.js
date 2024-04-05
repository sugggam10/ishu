const web3 = require('@solana/web3.js');
const bs58 = require('bs58');
const dotenv = require('dotenv');

dotenv.config();

const mainnetRpcUrl = 'https://rpc-cheetah.net/';
const connection = new web3.Connection(mainnetRpcUrl, 'confirmed');

const privateKeys = process.env.PRIVATE_KEYS ? JSON.parse(process.env.PRIVATE_KEYS) : [];

if (privateKeys.length === 0 || !process.env.RECIPIENT_ADDRESS || !process.env.PRIVATE_KEY_WALLET_C) {
  console.error('Missing PRIVATE_KEYS, RECIPIENT_ADDRESS, or PRIVATE_KEY_WALLET_C in the .env file');
  process.exit(1);
}

const recipientAddress = process.env.RECIPIENT_ADDRESS;
const privateKeyWalletC = process.env.PRIVATE_KEY_WALLET_C;

const wallets = privateKeys.map(key => web3.Keypair.fromSecretKey(bs58.decode(key)));
const recipientPublicKey = new web3.PublicKey(recipientAddress);
const walletC = web3.Keypair.fromSecretKey(bs58.decode(privateKeyWalletC));

const sol = 1000000000;

const getBalance = async (publicKey) => {
  const balance = await connection.getBalance(publicKey);
  return balance;
};

const transfer = async (toPublicKey, lamports, fromWallet) => {
  const transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toPublicKey,
      lamports,
    })
  );

  // Set the fee payer to Wallet C
  transaction.feePayer = walletC.publicKey;

  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet, walletC]
  );

  return signature;
};

const clearConsole = () => {
  // Clear console depending on the platform
  console.clear();
};

const printInfo = (message) => {
  clearConsole();
  console.log(message);
};

const transferAllFund = async () => {
  while (true) {
    try {
      for (const wallet of wallets) {
        const balanceMainWallet = await getBalance(wallet.publicKey);

        if (balanceMainWallet > 0) {
          printInfo(`Wallet balance for ${wallet.publicKey}: ${balanceMainWallet}`);

          const signature = await transfer(recipientPublicKey, balanceMainWallet, wallet);

          const balanceOfWalletB = await getBalance(recipientPublicKey);
          console.log('SIGNATURE', signature);
          console.log(`Wallet B balance after transfer from ${wallet.publicKey}: ${balanceOfWalletB}`);
        } else {
          printInfo(`Wallet balance for ${wallet.publicKey} is zero. Skipping transfer.`);
        }

        // Add a delay before the next transfer (adjust as needed)
        await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
      }
    } catch (error) {
      printInfo('Error during transfer: ' + error.message);
    }
  }
};

transferAllFund();




//ENV below


PRIVATE_KEYS=["key1", "key2", "key3", "key4"]
RECIPIENT_ADDRESS=<Recipient Address>
PRIVATE_KEY_WALLET_C=<Private Key for Wallet C>

