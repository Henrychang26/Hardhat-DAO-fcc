import { network, ethers } from "hardhat"
import { proposalsFile, developmentChains } from "./../helper-hardhat-config"
import * as fs from "fs"
import { moveBlocks } from "../utils/move-blocks"
import { VOTING_PERIOD } from "./../helper-hardhat-config"
const index = 0

// @ts-ignore

async function main(proposalIndex: number) {
    const proposals = JSON.parse(fs.readFileSync(proposalsFile), "utf8")
    const proposalId = proposals[network.config.chainId!][proposalIndex]
    // 0 = agains, 1 = for, 2= Adstain
    const voteWay = 1
    const governor = await ethers.getContract("GovernorContract")
    const reason = "I like a do da cha cha"
    const voteTxResponse = await governor.castVoteWithReason(proposalId, voteWay, reason)
    await voteTxResponse.wait(1)

    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1)
    }
    console.log("Voted! Ready to go!")
}

main(index)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
