// @ts-check
const fs = require("fs-extra")

// https://web.archive.org/cdx/search?url=mohu1.tk/uploads/&matchType=prefix&collapse=urlkey&output=json&fl=original&filter=!statuscode:[45]..&limit=100000

const filePath = "../backups/uploads4.json"
const baseURL = "https://web.archive.org/web/2019/"

/** @type {String[][]} */
const data = fs.readJSONSync(filePath)

const output = data.map(([url]) => {
    return [
        baseURL + url,
        url.replace(/http(s)?:\/\/(?:www\.)?mohu(?:1|2)?\.(?:club|tw|tk|ml|ooo)/, "")
    ]
})

fs.writeJSONSync(filePath, output, { spaces: 4 })
