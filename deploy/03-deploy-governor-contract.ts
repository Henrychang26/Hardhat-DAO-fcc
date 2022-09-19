import { GovernanceToken } from "./../typechain-types/GovernanceToken"
import { DeployFunction } from "hardhat-deploy/dist/types"
import { VOTING_DELAY, VOTING_PERIOD, QUORUM_PERCENTAGE } from "./../helper-hardhat-config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deployGovernorContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments } = hre
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const governanceToken = await get("GovernanceToken")
    const timeLock = await get("TimeLock")
    log("Deploying governor")
    const governorContract = await deploy("GovernorContract", {
        from: deployer,
        args: [
            governanceToken.address,
            timeLock.address,
            VOTING_DELAY,
            VOTING_PERIOD,
            QUORUM_PERCENTAGE,
        ],
        log: true,
    })
}

export default deployGovernorContract
