// @ts-check
const fs = require("fs-extra")

// https://web.archive.org/cdx/search?url=https%3A%2F%2Fwww.mohu.club%2Fuploads%2F&matchType=prefix&collapse=urlkey&output=json&fl=original&filter=!statuscode%3A[45]..&limit=100000

const filePath = "../backups/uploads2.json"
const baseURL = "https://web.archive.org/web/2019/"

/** @type {String[][]} */
const data = fs.readJSONSync(filePath)

const output = data.map(([url]) => {
    return [
        baseURL + url,
        url.replace("https://www.mohu.club", "")
    ]
})

fs.writeJSONSync(filePath, output, { spaces: 4 })
