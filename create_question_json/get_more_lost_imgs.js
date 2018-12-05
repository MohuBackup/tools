// @ts-check
const fs = require("fs-extra")
const { getAllQidsThen } = require("../util")

const backupType = "question"
const baseFilePath = `../../json/${backupType}`
const outputJsonFilePath = "../../archive.is/lost_imgs3.json"

const mohuHostName = /(?:www\.)?mohu(?:1|2)?\.(?:club|tw|tk|ml)/g.source
const protocol = /http(?:s)?:\/\//g.source

const rUrlPrefix = `${protocol}archive.is/o/\\w{5}/${protocol}${mohuHostName}`
const rSavePath = "/uploads/(?:\\w|\\.|/)+"
const rAlt = ".+?"
const rDownloadURL = `${protocol}archive.is/\\w{5}/(?:\\w+\\.\\w+)`

const quote = "\\\\\""
const r0 = new RegExp(`<a href=${quote}${rUrlPrefix}(${rSavePath})${quote}><img alt=${quote}(${rAlt})${quote} src=${quote}(${rDownloadURL})${quote}(?: title=${quote}(${rAlt})${quote})?(?:.+?)?></a>`, "g")


/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const jsonFilePath = `${baseFilePath}/${qid}.json`
    const input = await fs.readFile(jsonFilePath, "utf-8")

    /** @type {(import("../get_user_img").imgDataItem)[]} */
    const imgs = []

    const replacer = (match, savePath, alt, downloadURL, title) => {
        
        // alt == title 这在WeCenter的图片上传阶段就已经决定了
        console.log(alt)

        imgs.push([
            downloadURL,  // 下载地址
            savePath      // 保存路径
        ])

        return `<img alt=\\"${alt}\\" src=\\"${savePath}\\">`
    }


    const output = input.replace(r0, replacer)

    if (output != input) {
        console.log(jsonFilePath)
        fs.writeFile(jsonFilePath, output)
    }

    return imgs
}

Promise.all(
    getAllQidsThen(baseFilePath, handler)
).then((allImgs) => {

    const lostImgs = allImgs.filter(x => {
        return !!x
    }).reduce((l, x) => {
        return l.concat(x)
    }, [])

    fs.writeJson(outputJsonFilePath, lostImgs, { spaces: 4 })

})
