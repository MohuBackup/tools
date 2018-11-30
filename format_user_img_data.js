// @ts-check
const fs = require("fs-extra")

/** @typedef {import("./get_user_img_data").UserUploadsItem} UserUploadsItem */
/** @typedef {import("./get_user_img").imgDataItem} imgDataItem */

const inputFilePath0 = "../backups/uploads.json"
const inputFilePath1 = "../archive.is/uploads.json"
const outputFilePath = inputFilePath0

/** @type {UserUploadsItem[]} */
const input0 = fs.readJSONSync(inputFilePath0)

/** @type {UserUploadsItem[]} */
const input1 = fs.readJSONSync(inputFilePath1)

const lost = input1.map((x) => {
    const i = input0.findIndex((y) => {
        return y.alt == x.alt && y.title == x.title
    })

    if (i == -1) return x

    input0[i].downloadURL = x.src

})


fs.writeJSONSync(outputFilePath, input0, { spaces: 4 })
console.log(lost)

