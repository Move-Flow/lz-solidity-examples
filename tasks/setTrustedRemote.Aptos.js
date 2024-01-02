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
// remote aptos contract address
const remoteAddress = "0xe183c1a56f48ffbd9fb109c1e76b7e3952061be0f65f980aa2366684ab12219b";

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

    // concat remote and local address
    let remoteAndLocal = hre.ethers.utils.solidityPack(["address", "address"], [remoteAddress, localContractInstance.address])

    // check if pathway is already set
    let isTrustedRemoteSet = await localContractInstance.isTrustedRemote(remoteChainId, remoteAndLocal)
    console.log("bsc-testnet setTrustedRemote.Aptos isTrustedRemoteSet: ", isTrustedRemoteSet);
    if (!isTrustedRemoteSet) {
        try {
            const gasPrice = (await providerHttpAch.getGasPrice());
            let tx = await localContractInstance.setTrustedRemote(remoteChainId, remoteAndLocal, {nonce, gasPrice});
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

    // const gasPrice = await providerHttpAch.getGasPrice()
    // console.log("gasPrice", gasPrice);
    // const gasLimit = 8000000;
    // const value = ethers.utils.parseUnits("0.009");
    // // const value = ethers.BigNumber.from(gasPrice).mul(gasLimit/100);
    
    // // const { nativeFee, zroFee } = await localContractInstanceRead.quoteForSend(lzCallParams, adapterParams)
    // const withdrawCrossChainReq = await(await localContractInstance.withdrawCrossChainReq(remoteChainId, 0, {
    //     gasPrice,
    //     gasLimit,
    //     value,
    // })).wait();
    // console.log("withdrawCrossChainReq", withdrawCrossChainReq);
}
