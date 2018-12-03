// @ts-check
const fs = require("fs-extra")
const { getAllQidsThen } = require("../util")

const backupTypes = ["question", "article"]

const output = {}


/**
 * @param {number} qid 
 */
const handler = async (inputPath, qid) => {
    const data = await fs.readJson(`${inputPath}/${qid}.json`, "utf-8")

    /** @type {(import("./typedef").Tag)[]} */
    const tags = data.tags

    tags.forEach((tag) => {
        output[tag["tag-name"]] = tag["tag-id"]
    })

}

backupTypes.forEach(async (backupType) => {
    const inputPath = `../../json/${backupType}`

    // await handler(inputPath, 1)

    await Promise.all(
        getAllQidsThen(inputPath, (qid) => handler(inputPath, qid))
    )

    fs.writeJSON("../../backups/tags.json", output, { spaces: 4 })
})
