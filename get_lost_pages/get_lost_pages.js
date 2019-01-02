// @ts-check
const fs = require("fs-extra")
const { getAllQidsThen } = require("../util")

const baseFilePath = "../../json/question/"

const allQids = getAllQidsThen(baseFilePath, (qid) => qid)
const lastQid = allQids.slice(-1)[0]

const lostPages = []
for (let i = 1; i <= lastQid; i++) {
    if (!allQids.includes(i)) {
        lostPages.push(i)
    }
}

fs.writeJSONSync("./lost_pages.json", lostPages, { spaces: 4 })
