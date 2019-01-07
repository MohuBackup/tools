// @ts-check
const fs = require("fs-extra")
const path = require("path")
const { fetch, getProxyAgent } = require("./util")

const agent = getProxyAgent()

const baseFilePath = "../"
const jsonFilePath = "../backups/uploads4.json"
const baseURL = ""


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

/**
 * @param {string} f 
 * @param {string=} saveTo 
 */
const download = async (f, saveTo = f) => {
    try {
        const r = await fetch(baseURL + f, {
            timeout: 10000,
            agent
        })
        if (r.ok) {
            const imgPath = path.resolve(
                path.join(baseFilePath, saveTo)
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


/**
 * @param {string} file 
 * @param {Iterable} metadata 
 */
const saveMetaData = (file, metadata) => {
    return fs.writeFile(
        path.join(baseFilePath, file),
        JSON.stringify(
            [...metadata].sort(),
            null, 4
        )
    )
}


/**
 * @typedef {[string, string]} imgDataItem [下载地址, 保存路径]
 */

/**
 * @param {imgDataItem[]} imgData 
 */
const downloadAll = async (imgData) => {

    await Promise.all(
        imgData.map((x) => {
            return download(...x)
        })
    )

    let l = []
    successful.forEach((x) => {
        if (failed.delete(x)) {
            l.push(x)
        }
    })

    saveMetaData("uploads_failed.json", failed)
    saveMetaData("uploads_successful.json", successful)

    console.log(l)  // 之前失败重试后成功的项目
    console.log(successful.size + " succeeded")
    console.log(failed.size + " failed")

}

/**
 * @typedef {import("./format_user_avatar_data").FormattedUserAvatarData} FormattedUserAvatarData [ 用户id, 头像图片下载地址 ]
 */

/** @type {imgDataItem[]} */
const data = fs.readJSONSync(jsonFilePath)

downloadAll(data)
