const CHAIN_ID = require("../constants/chainIds.json")
const ENDPOINTS = require("../constants/layerzeroEndpoints.json")
const MV_JSON = require("../deployments/bsc-testnet/MoveflowCrosschain");

// read status of moveflow evm contract on testnet
module.exports = async function (taskArgs, hre) {
    const remoteChainId = CHAIN_ID[taskArgs.targetNetwork];
    // const moveflowCrosschain = await ethers.getContract("MoveflowCrosschain")

    const ENDPOINT_HTTP_ACHM = 'https://rpc.ankr.com/bsc_testnet_chapel';
    const providerHttpAch = new ethers.providers.JsonRpcProvider(ENDPOINT_HTTP_ACHM, 97);
    const moveflowCrosschain = new ethers.Contract("0x7F384B4a58df3e38CDF74727Cfbf9D22a65aCE1f", MV_JSON.abi, providerHttpAch);
    // const moveflowCrosschain = await ethers.getContract("MoveflowCrosschain", providerHttpAch.getSigner());

    /*
        // quote fee with default adapterParams
        const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, 200000]) // default adapterParams example

        // const payload = await omniCounter.PAYLOAD()
        const endpoint = await ethers.getContractAt("ILayerZeroEndpoint", ENDPOINTS[hre.network.name])
        const fees = await endpoint.estimateFees(remoteChainId, moveflowCrosschain.address, adapterParams, false, adapterParams)
        console.log(`fees[0] (wei): ${fees[0]} / (eth): ${ethers.utils.formatEther(fees[0])}`)
    */

    let tx = await moveflowCrosschain.getOracle(10108)
    console.log(`✅ Message Sent [${hre.network.name}] moveflowCrosschain on destination Moveflow @ [${remoteChainId}]`)
    console.log(`tx: ${tx}`)

    console.log(``)
    console.log(`Note: to poll/wait for the message to arrive on the destination use the command:`)
    console.log(`       (it may take a minute to arrive, be patient!)`)
    console.log("")
    console.log(`    $ npx hardhat --network ${taskArgs.targetNetwork} ocPoll`)
}
