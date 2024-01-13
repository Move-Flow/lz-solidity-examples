const CHAIN_ID = require("../constants/chainIds.json")
const { getDeploymentAddresses } = require("../utils/readStatic")
const dotenv = require("dotenv");
dotenv.config();

const { getAddress } = require("ethers/lib/utils");
// const ENDPOINT_HTTP = 'https://rpc.ankr.com/bsc_testnet_chapel';
const ENDPOINT_HTTP = "https://go.getblock.io/7b3534a27b7947dda6070eb44789e4be";
// const ENDPOINT_HTTP = "https://bsc-testnet.blastapi.io/c5accb66-4edf-43b4-9e71-698b48a64ba4";
// const ENDPOINT_HTTP = "https://bsc-testnet.blockpi.network/v1/rpc/public";

const mflAddress = "0xDE3a190D9D26A8271Ae9C27573c03094A8A2c449";
const gasLimit = 8000000;

// remote aptos testnet id
const remoteChainId = 10108

module.exports = async function (taskArgs, hre) {
    console.log("bsc-testnet fundRecipient");
    const providerHttpAch = new ethers.providers.JsonRpcProvider(ENDPOINT_HTTP, 97);
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
    const signer = wallet.connect(providerHttpAch);
    // console.log("bsc-testnet setTrustedRemote.Aptos signer: ", signer);
    const nonce = await providerHttpAch.getTransactionCount(wallet.address);
    console.log("nonce", nonce);
    let gasPrice = (await providerHttpAch.getGasPrice());
    console.log("gasPrice", gasPrice)

    const localContractInstance = await ethers.getContract("MoveflowCrossschain");
    const localContractInstanceRead = await ethers.getContract("MoveflowCrossschain");
    const trustedRemoteRe = await localContractInstanceRead.trustedRemoteLookup(remoteChainId)
    console.log("trustedRemoteRe", trustedRemoteRe);

    let payload = hre.ethers.utils.solidityPack(["uint8", "address", "address", "uint64"],
        [1, wallet.address, mflAddress, 13]);
    console.log(payload, payload.length);

    const fundRecipientRe = await(await localContractInstance.fundRecipient(payload, {
        gasPrice,
        gasLimit,
    })).wait();
    console.log("fundRecipient", fundRecipientRe);
}
