
const fs = require("fs-extra")
const path = require("path")

const filePath = "../backups/avatars.json"

/** @type {String[][]} */
const data = JSON.parse(
    fs.readFileSync(filePath, "utf-8")
)


const firstElement = data.shift()


const output = JSON.stringify(
    data.map((d) => {
        const o = {}
        firstElement.forEach((key, index) => {
            o[key] = d[index]
        })
        return o
    }),
    null, 4
)

fs.writeFileSync(filePath, output)

