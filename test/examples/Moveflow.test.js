const { expect } = require("chai")
const { ethers } = require("hardhat")

const remoteAddress = "0x9ae8412de465c9fbf398ea46dfd23196cf216918321688b213e5da904d281886";
const remoteMflAddress = `${remoteAddress}::Coins::MFL`;
// use this chainId
chainId = 97
remoteChainId = 10108

describe("Moveflow", function () {
    beforeEach(async function () {
        // create a LayerZero Endpoint mock for testing
        const LayerZeroEndpointMock = await ethers.getContractFactory("LZEndpointMock")
        this.lzEndpointMock = await LayerZeroEndpointMock.deploy(chainId)

        const mf = await ethers.getContractFactory("MoveflowCrosschain")
        this.mfCtrt = await mf.deploy(this.lzEndpointMock.address)

        const mfl = await ethers.getContractFactory("MFLToken")
        this.mflTk = await mfl.deploy()
    })

    it("Deposit MFL to cx chain pool", async function () {
        expect(0).to.be.equal(0) // initial value
        const deployer = await this.mfCtrt.deployer();
        console.log("deployer", deployer);

        // Mint MFL
        const mintMFLRe = await (await this.mflTk.mint()).wait();
        console.log("mintMFLRe", mintMFLRe);

        // Register MFL
        const remoteCoinData = ethers.utils.toUtf8Bytes(remoteMflAddress);
        const registerCoinRe = await (await this.mfCtrt.registerCoin(remoteCoinData, this.mflTk.address)).wait();
        console.log("registerCoinRe", registerCoinRe);
    
        // Deposit MFL to cx chain pool
        const cxPool = await this.mfCtrt.coinPoolMap(this.mflTk.address);
        console.log("cxPool", cxPool);
        const approveRe = await(await this.mflTk.approve(cxPool, ethers.utils.parseUnits("1", 8))).wait();
        console.log("approveRe", approveRe);
        const depositRe = await (await this.mfCtrt.crossChainPoolDeposit(this.mflTk.address, ethers.utils.parseUnits("1", 8))).wait();
        console.log("depositRe", depositRe);

        // const _packType = ethers.utils.defaultAbiCoder.encode(['uint8'], [1]);
        // const encodedTo = ethers.utils.defaultAbiCoder.encode(['address'], [deployer]);
        // const encodedToken = ethers.utils.defaultAbiCoder.encode(['address'], [deployer]);
        // const encodedAmountSD = ethers.utils.defaultAbiCoder.encode(['uint64'], [13]);
        // Concatenate the encoded values to compose the bytesVariable
        // const payload = ethers.utils.hexConcat([_packType, encodedTo, encodedToken, encodedAmountSD]);

        // set trust remote
        let remoteAndLocal = hre.ethers.utils.solidityPack(["address", "address"], [remoteAddress, this.mfCtrt.address])
        let tx = await this.mfCtrt.setTrustedRemote(remoteChainId, remoteAndLocal);
        let _txre = await (tx).wait();
        console.log(` txre:`, JSON.stringify(_txre, null, 2));

        let payload = hre.ethers.utils.defaultAbiCoder.encode(["uint8", "address", "address", "uint64"], [1, deployer, this.mflTk.address, 13]);
        // let payload = hre.ethers.utils.solidityPack(["uint8", "address", "address", "uint64"], [1, deployer, deployer, 13]);
        console.log(payload, payload.length);
        const recre = await (await this.mfCtrt.lzReceive(remoteChainId, remoteAndLocal, 5, payload)).wait();
        console.log("recre", recre);
    })

    // it("test decode payload", async function () {
    // const decodeRe = await this.mfCtrt._decodeReceivePayload(payload);
    // console.log("decodeRe", decodeRe);
    // const fundRecipientRe = await(await this.mfCtrt.fundRecipient(payload)).wait();
    // console.log("fundRecipientRe", fundRecipientRe);        
    // })
})
