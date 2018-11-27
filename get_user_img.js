
const fs = require("fs-extra")
const path = require("path")
const fetch = require("node-fetch")

const baseFilePath = "../backups/"
const jsonFileName = path.join(baseFilePath, "uploads.json")

const baseURL = "https://via.hypothes.is/https://web.archive.org/web/2im_/www.mohu.club"


const failed = new Set()
const successful = new Set()


const download = async (f) => {
    try {
        const r = await fetch(baseURL + f)
        if (r.ok) {
            const imgPath = path.resolve(
                path.join(baseFilePath, f)
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


const saveMetaData = (file, metadata) => {
    return fs.writeFile(
        path.join(baseFilePath, file),
        JSON.stringify(
            [...metadata].sort(),
            null, 4
        )
    )
}


(async () => {

    const imgData = JSON.parse(
        await fs.readFile(jsonFileName, "utf-8")
    )

    await Promise.all(
        imgData.map(f => {
            return download(f)
        })
    )

    saveMetaData("uploads_failed.json", failed)
    saveMetaData("uploads_successful.json", successful)

    console.log(successful)
    console.log(failed)

})()

