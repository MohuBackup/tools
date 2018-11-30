// @ts-check
const fs = require("fs-extra")

/** @typedef {import("./util").AvatarUrlObj} AvatarUrlObj */
/** @typedef {import("./util").UserObj} UserObj */


const jsonFilePath = "../backups/users.json"


const main = async () => {
    /** @type {AvatarUrlObj[]} */
    const input = await fs.readJSON("../archive.is/avatars_short.json")

    /** @type {UserObj[]} */
    const saved = await fs.readJSON(jsonFilePath)

    const notFound = []
    
    input.forEach((x) => {
        const i = saved.findIndex((y) => {
            return y["user-url"] == x["user-url"]
        })

        if (i == -1) return notFound.push(x)

        saved[i].avatar = x.avatar

    })

    console.log(notFound)

    const output = saved

    fs.writeJSON(jsonFilePath, output, { spaces: 4 })
}

main()
