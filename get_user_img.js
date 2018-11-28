
const fs = require("fs-extra")
const path = require("path")
const fetch = require("node-fetch")

const baseFilePath = "../backups/"
const jsonFileName = path.join(baseFilePath, "avatars.json")

const baseURL = "https://via.hypothes.is/https://web.archive.org/web/2im_/www.mohu.club"


const loadMetaData = (file) => {
    const filePath = path.join(baseFilePath, file)

    if (fs.existsSync(filePath)) {
        return JSON.parse(
            fs.readFileSync(filePath, "utf-8")
        ) || []
    } else {
        return []
    }
}


const failed = new Set(loadMetaData("uploads_failed.json"))
const successful = new Set(loadMetaData("uploads_successful.json"))


const download = async (f) => {
    try {
        const r = await fetch(baseURL + f, {
            timeout: 5000
        })
        if (r.ok) {
            const imgPath = path.resolve(
                path.join(baseFilePath, f)
            )

            fs.ensureDirSync(path.parse(imgPath).dir)
            const fileStream = fs.createWriteStream(imgPath)

            r.body.pipe(fileStream)

            await new Promise((resolve) => {
                fileStream.on("close", () => {
                    failed.delete(f)
                    successful.add(f)
                    resolve()
                })
            })

        } else {
            failed.add(f)
            if (r.status != 404) console.error(f + " " + r.status)
            return
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


const downloadAll = async (imgData) => {

    await Promise.all(
        imgData.map(f => {
            return download(f)
        })
    )

    saveMetaData("uploads_failed.json", failed)
    saveMetaData("uploads_successful.json", successful)

    console.log(successful.size + " successful")
    console.log(failed.size + " failed")

}

/**
 * @param {number} n 
 * @returns {string}
 */
const pad2 = (n) => {
    return String(Math.floor(n)).padStart(2, "0")
}


const imgData = JSON.parse(
    fs.readFileSync(jsonFileName, "utf-8")
).map(x => {
    return x.original.replace("https://www.mohu.club", "")
})

downloadAll(imgData)


// ["/uploads/avatar/000/00/06/69_avatar_mid.jpg"]

