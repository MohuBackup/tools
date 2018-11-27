
const fs = require("fs-extra")
const path = require("path")
const fetch = require("node-fetch")

const baseFileName = "../backups/"
const jsonFileName = "../backups/uploads.json"

const baseURL = "https://via.hypothes.is/https://web.archive.org/web/2im_/www.mohu.club"


const failed = new Set()
const successful = new Set()


const session = async (f) => {
    try {
        const r = await fetch(baseURL + f)
        if (r.ok) {
            const imgPath = path.resolve(
                path.join(baseFileName, f)
            )

            fs.ensureDirSync(path.parse(imgPath).dir)
            const fileStream = fs.createWriteStream(imgPath)

            r.body.pipe(fileStream)

            await new Promise((resolve) => {
                fileStream.on("close", () => {
                    successful.add(f)
                    resolve()
                })
            })

        } else {
            failed.add(f)
            return console.error(f + " " + r.status)
        }
    } catch (e) {
        failed.add(f)
        return console.error(f + " " + e)
    }

}


// fs.readFile(jsonFileName, "utf-8")
session("/uploads/avatar/000/00/08/81_avatar_mid.jpg").then(() => {
    console.log(successful)
    console.log(failed)
})
