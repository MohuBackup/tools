// @ts-check
const fs = require("fs-extra")

// https://web.archive.org/cdx/search?url=mohu.ml/uploads/&matchType=prefix&collapse=urlkey&output=json&fl=original&filter=!statuscode:[45]..&limit=100000

const filePath = "../backups/uploads3.json"
const baseURL = "https://web.archive.org/web/2019/"

/** @type {String[][]} */
const data = fs.readJSONSync(filePath)

const output = data.map(([url]) => {
    return [
        baseURL + url,
        url.replace(/http(s)?:\/\/(www\.)?mohu\.ml/, "")
    ]
})

fs.writeJSONSync(filePath, output, { spaces: 4 })
