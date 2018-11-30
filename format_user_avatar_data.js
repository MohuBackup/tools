// @ts-check
const fs = require("fs-extra")

/** @typedef {import("./util").UserObj} UserObj */
/** @typedef {[number, string ]} FormattedUserAvatarData */


const jsonFilePath = "../backups/users.json"
const outputFilePath = "../backups/avatars.json"

/** @type {UserObj[]} */
const users = fs.readJSONSync(jsonFilePath)

/** @type {FormattedUserAvatarData[]} */
const output = users.filter(
    (x) => {
        return x.avatar && x.avatar.includes("https://archive.is/")
    }
).map(
    /** @returns {FormattedUserAvatarData} */
    (x) => {
        return [
            x["user-id"],
            x.avatar
        ]
    }
)

fs.writeJSONSync(outputFilePath, output, { spaces: 4 })
console.log(output)



