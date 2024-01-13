const CHAIN_ID = require("../constants/chainIds.json")
const { getDeploymentAddresses } = require("../utils/readStatic")
const dotenv = require("dotenv");
dotenv.config();

const LZ_EP = "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1";
const LZ_EP_JSON = require("../constants/endpoint_abi.json");
const { getAddress } = require("ethers/lib/utils");
// const ENDPOINT_HTTP = 'https://rpc.ankr.com/bsc_testnet_chapel';
const ENDPOINT_HTTP = "https://go.getblock.io/7b3534a27b7947dda6070eb44789e4be";
// const ENDPOINT_HTTP = "https://bsc-testnet.blastapi.io/c5accb66-4edf-43b4-9e71-698b48a64ba4";
// const ENDPOINT_HTTP = "https://bsc-testnet.blockpi.network/v1/rpc/public";

const gasLimit = 800000;

// source chain testnet id
const localChainId = 10102;

// remote aptos testnet id
const remoteChainId = 10108;
const streamId = 0;

module.exports = async function (taskArgs, hre) {
    console.log("bsc-testnet withdrawFrom.Aptos");
    const providerHttpAch = new ethers.providers.JsonRpcProvider(ENDPOINT_HTTP, 97);
    const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC);
    const signer = wallet.connect(providerHttpAch);
    // console.log("bsc-testnet setTrustedRemote.Aptos signer: ", signer);
    const nonce = await providerHttpAch.getTransactionCount(wallet.address);
    console.log("nonce", nonce);
    let gasPrice = (await providerHttpAch.getGasPrice());
    console.log("gasPrice", gasPrice)

    const localContractInstance = await ethers.getContract("MoveflowCrosschain");
    const localContractInstanceRead = await ethers.getContract("MoveflowCrosschain");
    const trustedRemoteRe = await localContractInstanceRead.trustedRemoteLookup(remoteChainId)
    console.log("trustedRemoteRe", trustedRemoteRe);

    const value = ethers.utils.parseUnits("0.05");

    // const { nativeFee, zroFee } = await localContractInstanceRead.quoteForSend(lzCallParams, adapterParams)
      const withdrawCrossChainReq = await(await localContractInstance.withdrawCrossChainReq(remoteChainId, streamId, {
        gasPrice,
        gasLimit,
        value
    })).wait();
    console.log("withdrawCrossChainReq", withdrawCrossChainReq);

/*      // check stucked cx chain tx
    const lzEp = new ethers.Contract(LZ_EP, LZ_EP_JSON, signer);
    const payload = ethers.utils.solidityPack(["uint8", "uint64"], [0, streamId]);
    const _trustedRemoteRe = ethers.utils.solidityPack(["address"], [trustedRemoteRe]);
    let hasStoredPayloadRe = await lzEp.hasStoredPayload(remoteChainId, trustedRemoteRe);
    console.log("hasStoredPayloadRe", hasStoredPayloadRe);
    let retryPayloadRe = await (await lzEp.retryPayload(remoteChainId, _trustedRemoteRe, payload, {
        gasLimit
    })).wait();
    console.log("retryPayloadRe", retryPayloadRe);
    let forceResumeReceiveRe = await (await lzEp.forceResumeReceive(remoteChainId, _trustedRemoteRe, {
        gasLimit
    })).wait();
    console.log("forceResumeReceiveRe", forceResumeReceiveRe);
 */
}
