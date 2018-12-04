// @ts-check
const fs = require("fs-extra")
const { getAllQidsThen } = require("../util")

const backupType = "question"
const baseFilePath = `../../json/${backupType}`

const r0 = /(\/uploads\/(\w|\.|\/)+)/g
const r1 = /http(?:s)?:\/\/archive.is\/o\/\w{5}\/http(?:s)?:\/\/(?:www\.)?mohu(?:1|2)?.(?:club|tw|tk|ml)(\/uploads\/(?:\w|\.|\/)+)/g
const r2 = /http(?:s)?:\/\/archive.is\/\w{5}\/(?:\w+\.\w+)/g

const quote = "\\\\\""
const r3 = new RegExp(`<a href=${quote}${r1.source}${quote}><img alt=${quote}(\\w+\\.\\w+)${quote} src=${quote}(${r2.source})${quote}></a>`, "g")


/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const jsonFilePath = `${baseFilePath}/${qid}.json`
    const input = await fs.readFile(jsonFilePath, "utf-8")

    const replacer = (match, ...args) => {
        args.pop()
        args.pop()
        console.log(args)
    }


    input.replace(r3, replacer)

    const m = input.match(r1)

    if (!m) return

    /** @type {string[]} */
    const saveToPaths = m.reduce((l, x) => {
        return l.concat(
            x.match(r0)[0]
        )
    }, [])

    const downloadURLs = input.match(r2)

    if (saveToPaths.length != downloadURLs.length) {
        console.error(jsonFilePath + " failed")
        return
    }

    /** @type {(import("../get_user_img").imgDataItem)[]} */
    const imgs = downloadURLs.map(
        /** @return {[string, string]} */
        (x, i) => {
            return [
                x,              // 下载地址
                saveToPaths[i]  // 保存路径
            ]
        }
    )

    // console.log(imgs)

    // if (output != input) {
    //     console.log(jsonFilePath)
    //     fs.writeFile(jsonFilePath, output)
    // }

    return imgs
}

// Promise.all(
//     [handler(1259)]
//     // getAllQidsThen(baseFilePath, handler)
// ).then((allImgs) => {

//     const lostImgs = allImgs.filter(x => {
//         return !!x
//     }).reduce((l, x) => {
//         return l.concat(x)
//     }, [])

// })

handler(1259)