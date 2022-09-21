import { utils } from "ethers"
import {
    FUNC,
    MIN_DELAY,
    NEW_STORE_VALUE,
    PROPOSAL_DESCRIPTION,
    VOTING_DELAY,
    VOTING_PERIOD,
} from "./../helper-hardhat-config"
import { Box } from "./../typechain-types/Box"
import { TimeLock } from "./../typechain-types/TimeLock"
import { GovernanceToken } from "./../typechain-types/GovernanceToken"
import { GovernorContract } from "./../typechain-types/GovernorContract"
// @ts-ignore
import { deployments, ethers } from "hardhat"
import { expect } from "chai"
import { moveBlocks } from "../utils/move-blocks"
import assert from "assert"
import { moveTime } from "../utils/move-time"

describe("Governor Flow", async () => {
    let governor: GovernorContract
    let governanceToken: GovernanceToken
    let timeLock: TimeLock
    let box: Box

    const voteWay = 1
    const reason = "I lika do cha cha cha"

    beforeEach(async () => {
        await deployments.fixture(["all"])
        governor = await ethers.getContract("GovernorContract")
        timeLock = await ethers.getContract("TimeLock")
        governanceToken = await ethers.getContract("GovernanceToken")
        box = await ethers.getContract("Box")
    })

    it("can only be changed through governance", async () => {
        await expect(box.store(55)).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("proposes, votes, waits, queues, and then execute", async () => {
        //propose
        const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, [NEW_STORE_VALUE])
        const proposeTx = await governor.propose(
            [box.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        )
        const proposeReceipt = await proposeTx.wait(1)
        const proposalId = proposeReceipt.events![0].args!.proposalId
        let proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State: ${proposalState}`)

        await moveBlocks(VOTING_DELAY + 1)
        //Vote
        const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
        await voteTx.wait(1)
        proposalState = await governor.state(proposalId)
        assert.equal(proposalState.toString(), "1")
        console.log(`Current Proposal State: ${proposalState}`)
        await moveBlocks(VOTING_PERIOD + 1)

        //Queue & execute
        const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
        const queueTx = await governor.queue(
            [box.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
        )
        await queueTx.wait(1)
        await moveTime(MIN_DELAY + 1)
        await moveBlocks(1)

        proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State: ${proposalState}`)

        console.log("Executing...")
        console.log
        const exTx = await governor.execute(
            [box.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
        )
        await exTx.wait(1)
        console.log((await box.retrieve()).toString())
    })
})
