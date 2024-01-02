const CHAIN_ID = require("../constants/chainIds.json")
const { getDeploymentAddresses } = require("../utils/readStatic")
const dotenv = require("dotenv");
dotenv.config();

// const MV_JSON = require("../abi/testnet02/MoveflowCrosschain");
const MV_JSON = require("../deployments/bsc-testnet/MoveflowCrosschain");
const ENDPOINT_HTTP = 'https://rpc.ankr.com/bsc_testnet_chapel';
// const ENDPOINT_HTTP = "https://go.getblock.io/7b3534a27b7947dda6070eb44789e4be";
// const ENDPOINT_HTTP = "https://bsc-testnet.blastapi.io/c5accb66-4edf-43b4-9e71-698b48a64ba4";
// const ENDPOINT_HTTP = "https://bsc-testnet.blockpi.network/v1/rpc/public";

const localContractAdd = "0x7166bfDfC46Efdda2d2AfCa86D2b96c9b0c23fE1";

// remote aptos testnet id
const remoteChainId = 10108

module.exports = async function (taskArgs, hre) {
    console.log("bsc-testnet setTrustedRemote.Aptos");
    const providerHttpAch = new ethers.providers.JsonRpcProvider(ENDPOINT_HTTP, 97);
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
    const signer = wallet.connect(providerHttpAch);
    // console.log("bsc-testnet setTrustedRemote.Aptos signer: ", signer);
    const nonce = await providerHttpAch.getTransactionCount(wallet.address);
    console.log("nonce", nonce);
    const localContractInstance =new ethers.Contract(localContractAdd, MV_JSON.abi, signer);
    // const localContractInstance = await ethers.getContract("MoveflowCrosschain")

    const localContractInstanceRead = new ethers.Contract(localContractAdd, MV_JSON.abi, providerHttpAch);
    const trustedRemoteRe = await localContractInstanceRead.trustedRemoteLookup(remoteChainId)
    console.log("is trustedRemote set:", trustedRemoteRe);

    const gasPrice = await providerHttpAch.getGasPrice()
    console.log("gasPrice", gasPrice);
    const gasLimit = 8000000;
    const value = ethers.utils.parseUnits("0.009");
    // const value = ethers.BigNumber.from(gasPrice).mul(gasLimit/100);
    
    // const { nativeFee, zroFee } = await localContractInstanceRead.quoteForSend(lzCallParams, adapterParams)
    const withdrawCrossChainReq = await(await localContractInstance.withdrawCrossChainReq(remoteChainId, 0, {
        gasPrice,
        gasLimit,
        value,
    })).wait();
    console.log("withdrawCrossChainReq", withdrawCrossChainReq);
}
