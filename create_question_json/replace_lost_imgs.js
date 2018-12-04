// @ts-check
const fs = require("fs-extra")
const { getAllQidsThen } = require("../util")

const backupType = "question"
const baseFilePath = `../../json/${backupType}`
const lostImgsFilePath = "../../archive.is/lost_imgs.json"

/** @type {(import("../get_user_img").imgDataItem)[]} */
const lostImgs = fs.readJSONSync(lostImgsFilePath)

/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const jsonFilePath = `${baseFilePath}/${qid}.json`
    const input = await fs.readFile(jsonFilePath, "utf-8")
    let output = input

    lostImgs.forEach(x => {
        output = output.replace(x[0], x[1])
    })

    if (output != input) {
        console.log(jsonFilePath)
        fs.writeFile(jsonFilePath, output)
    }
}

// handler(3)
getAllQidsThen(baseFilePath, handler)
