
const fs = require("fs-extra")
const path = require("path")

const backupType = "article"
const baseFileName = `../backups/${backupType}/`
const jsonFileName = "../backups/uploads.json"

const imgReg = /\/uploads\/.+?\.(jpg|jpeg|png|gif)/g

let allImgs = new Set()

const process = async (qid) => {
    const filepath = path.normalize(`${baseFileName}/${qid}.html`)
    const html = await fs.readFile(filepath, "utf-8")

    const imgs = html.match(imgReg)

    if (!imgs) return

    console.log(imgs.length)

    imgs.forEach((img) => {
        allImgs.add(img)
    })
}


(async () => {
    await Promise.all(
        fs.readdirSync(baseFileName)
            .map((f) => path.parse(f).name)
            .filter((id) => Number.isInteger(+id))
            .sort((a, b) => (a | 0) - (b | 0))
            .map((qid) => {
                return process(qid)
            })
    )

    console.log(allImgs.size)

    fs.writeFileSync(jsonFileName, JSON.stringify([...allImgs]))

})()


// fs.ensureFileSync("./abc/123/1.txt")
