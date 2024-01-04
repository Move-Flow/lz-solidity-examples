const CHAIN_ID = require("../constants/chainIds.json")
const { getDeploymentAddresses } = require("../utils/readStatic")
const dotenv = require("dotenv");
dotenv.config();

// const MV_JSON = require("../abi/testnet02/MoveflowCrosschain");
const MV_JSON = require("../deployments/bsc-testnet/MoveflowCrosschain");
const { getAddress } = require("ethers/lib/utils");
const MFL_JSON = require("../deployments/bsc-testnet/MFLToken");
// const ENDPOINT_HTTP = 'https://rpc.ankr.com/bsc_testnet_chapel';
const ENDPOINT_HTTP = "https://go.getblock.io/7b3534a27b7947dda6070eb44789e4be";
// const ENDPOINT_HTTP = "https://bsc-testnet.blastapi.io/c5accb66-4edf-43b4-9e71-698b48a64ba4";
// const ENDPOINT_HTTP = "https://bsc-testnet.blockpi.network/v1/rpc/public";

const localContractAdd = "0x0B858B1C52e49DF07fd96b87CF5DA7838f170c04";
// remote aptos contract address
const remoteAddress = "0x9ae8412de465c9fbf398ea46dfd23196cf216918321688b213e5da904d281886";
// test token address
const mflAddress = "0xDE3a190D9D26A8271Ae9C27573c03094A8A2c449";
const remoteMflAddress = `${remoteAddress}::Coins::MFL`;
// const remoteMflAddress = `Coins::MFL`;
const gasLimit = 8000000;

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
    let gasPrice = (await providerHttpAch.getGasPrice());
    console.log("gasPrice", gasPrice)

    const mflInstance = new ethers.Contract(mflAddress, MFL_JSON.abi, signer);
    const localContractInstance = new ethers.Contract(localContractAdd, MV_JSON.abi, signer);
    // const localContractInstance = await ethers.getContract("MoveflowCrosschain")
    const remoteCoinData = ethers.utils.toUtf8Bytes(remoteMflAddress);
    // const remoteCoinData2 = ethers.utils.solidityPack(["string"], [remoteMflAddress]);

    // Register MFL
    const registerCoinRe = await (await localContractInstance.registerCoin(remoteCoinData, mflAddress,
        {gasPrice, gasLimit})).wait();
    console.log("registerCoinRe", registerCoinRe);

    // Deposit MFL to cx chain pool
    const cxPool = await localContractInstance.coinPoolMap(mflAddress);
    console.log("cxPool", cxPool);
    const approveRe = await(await mflInstance.approve(cxPool, ethers.utils.parseEther("1"),
        {gasPrice, gasLimit})).wait();
    console.log("approveRe", approveRe);
    const depositRe = await (await localContractInstance.crossChainPoolDeposit(mflAddress, ethers.utils.parseEther("1"),
        {gasPrice, gasLimit})).wait();
    console.log("depositRe", depositRe);


    // concat remote and local address
    let remoteAndLocal = hre.ethers.utils.solidityPack(["address", "address"], [remoteAddress, localContractInstance.address])

    // check if pathway is already set
    let isTrustedRemoteSet = await localContractInstance.isTrustedRemote(remoteChainId, remoteAndLocal)
    console.log("bsc-testnet setTrustedRemote.Aptos isTrustedRemoteSet: ", isTrustedRemoteSet);
    if (!isTrustedRemoteSet) {
        try {
            let tx = await localContractInstance.setTrustedRemote(remoteChainId, remoteAndLocal, {gasPrice});
            console.log(` tx: ${JSON.stringify(tx, null, 2)}`)
            let _tx = await (tx).wait();
            console.log(` txre:`, JSON.stringify(_tx, null, 2));
            console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
        } catch (e) {
            console.error(e);
        }
    } else {
        console.log("*source already set*")
    }

    isTrustedRemoteSet = await localContractInstance.isTrustedRemote(remoteChainId, remoteAndLocal)
    console.log(`isTrustedRemoteSet re: ${isTrustedRemoteSet}`)

    const localContractInstanceRead = new ethers.Contract(localContractAdd, MV_JSON.abi, providerHttpAch);
    const trustedRemoteRe = await localContractInstanceRead.trustedRemoteLookup(remoteChainId)
    console.log("trustedRemoteRe", trustedRemoteRe);
}
