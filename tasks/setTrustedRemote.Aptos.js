const CHAIN_ID = require("../constants/chainIds.json")
const { getDeploymentAddresses } = require("../utils/readStatic")
const dotenv = require("dotenv");
dotenv.config();

const localContractAdd = "0x7F384B4a58df3e38CDF74727Cfbf9D22a65aCE1f";

// remote aptos contract address
const remoteAddress = "0xdbf4ebd276c84e88f0a04a4b0d26241f654ad411c250afa3a888eb3f0011486a";

// remote aptos testnet id
const remoteChainId = 10108

module.exports = async function (taskArgs, hre) {
    const MV_JSON = require("../deployments/bsc-testnet/MoveflowCrosschain");
    // const ENDPOINT_HTTP_ACHM = 'https://rpc.ankr.com/bsc_testnet_chapel';
    // const ENDPOINT_HTTP_ACHM = "https://go.getblock.io/7b3534a27b7947dda6070eb44789e4be";
    const ENDPOINT_HTTP_ACHM = "https://bsc-testnet.blastapi.io/c5accb66-4edf-43b4-9e71-698b48a64ba4";
    // const ENDPOINT_HTTP_ACHM = "https://data-seed-prebsc-2-s2.bnbchain.org:8545";
    const providerHttpAch = new ethers.providers.JsonRpcProvider(ENDPOINT_HTTP_ACHM, 97);
    const signer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(providerHttpAch);
    const localContractInstance =new ethers.Contract(localContractAdd, MV_JSON.abi, signer);
    // const localContractInstance = await ethers.getContract("MoveflowCrosschain")

    // concat remote and local address
    let remoteAndLocal = hre.ethers.utils.solidityPack(["address", "address"], [remoteAddress, localContractInstance.address])

    // check if pathway is already set
    let isTrustedRemoteSet = await localContractInstance.isTrustedRemote(remoteChainId, remoteAndLocal)

    if (!isTrustedRemoteSet) {
        try {
            // let tx = await (await localContractInstance.setTrustedRemote(remoteChainId, remoteAndLocal)).wait()
            // console.log(`✅ [${hre.network.name}] setTrustedRemote(${remoteChainId}, ${remoteAndLocal})`)
            // console.log(` tx: ${tx.transactionHash}`)
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

    const gasPrice = await providerHttpAch.getGasPrice()
    console.log("gasPrice", gasPrice);
    const gasLimit = 8000000;
    const value = ethers.utils.parseUnits("0.009");
    // const value = ethers.BigNumber.from(gasPrice).mul(gasLimit/100);
    
    // const { nativeFee, zroFee } = await localContractInstanceRead.quoteForSend(lzCallParams, adapterParams)
    const withdrawCrossChainReq = await(await localContractInstance.withdrawCrossChainReq(remoteChainId, 0, {
        // gasPrice,
        gasLimit,
        value,
    })).wait();
    console.log("withdrawCrossChainReq", withdrawCrossChainReq);
}
