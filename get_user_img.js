
const fs = require("fs-extra")
const path = require("path")
const fetch = require("node-fetch")

// 使用梯子，不解释
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
const SocksProxyAgent = require("socks-proxy-agent")
const proxy = "socks://127.0.0.1:1080"
const agent = new SocksProxyAgent(proxy, true)


const baseFilePath = "../archive.is/"
const baseURL = "https://archive.is/20181108035912/https://www.mohu.club/"


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
            timeout: 10000,
            agent
        })
        if (r.ok) {
            const imgPath = path.resolve(
                path.join(baseFilePath, f + ".html")
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
 * @param {number} n 
 * @returns {string}
 */
const pad2 = (n) => {
    return String(Math.floor(n)).padStart(2, "0")
}


let data = []
for (let qid = 1; qid <= 500; qid++) {
    data.push(`article/${qid}`)
}


downloadAll(data)
