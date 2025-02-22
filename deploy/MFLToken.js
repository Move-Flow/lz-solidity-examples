module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()
    console.log(`>>> your address: ${deployer}`)

    await deploy("MFLToken", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: 1,
    })
}

module.exports.tags = ["MFLToken"]
