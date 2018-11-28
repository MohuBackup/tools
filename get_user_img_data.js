
const fs = require("fs-extra")
const path = require("path")
const { getAllQidsThen } = require("./util")

const backupTypes = ["article", "question"]
const jsonFileName = "../backups/uploads.json"

const imgReg = /\/uploads\/.+?\.(jpg|jpeg|png|gif)/g

let allImgs = new Set()

const handler = async (baseFileName, qid) => {
    const filepath = path.normalize(`${baseFileName}/${qid}.html`)
    const html = await fs.readFile(filepath, "utf-8")

    const imgs = html.match(imgReg)

    if (!imgs) return

    // console.log(imgs.length)

    imgs.forEach((img) => {
        allImgs.add(img)
    })
}

backupTypes.forEach(async (backupType) => {
    const baseFileName = `../backups/${backupType}/`

    const cb = (qid) => handler(baseFileName, qid)

    await Promise.all(
        getAllQidsThen(baseFileName, cb)
    )

    console.log(allImgs.size)

    fs.writeFileSync(
        jsonFileName,
        JSON.stringify(
            [...allImgs].sort(),
            null, 4
        )
    )

})
