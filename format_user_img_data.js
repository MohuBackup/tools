// @ts-check
const fs = require("fs-extra")

/** @typedef {import("./get_user_img_data").UserUploadsItem} UserUploadsItem */
/** @typedef {import("./get_user_img").imgDataItem} imgDataItem */

const inputFilePath0 = "../backups/uploads.json"
const inputFilePath1 = "../archive.is/uploads.json"
const outputFilePath = "../backups/uploads_formatted.json"

/** @type {UserUploadsItem[]} */
const input0 = fs.readJSONSync(inputFilePath0)

/** @type {UserUploadsItem[]} */
const input1 = fs.readJSONSync(inputFilePath1)

const formatted = input1.map(
    /** @returns {imgDataItem} */
    (x) => {
        const i = input0.findIndex((y) => {
            return y.alt == x.alt && y.title == x.title
        })

        if (i == -1) return

        return [
            x.src,
            input0[i].src
        ]

    }
).filter(x => !!x)


fs.writeJSONSync(outputFilePath, formatted, { spaces: 4 })
console.log(formatted.length)

