// @ts-check
// 恢复部分json文件到从archive.org上的备份抓取时的状态
const fs = require("fs-extra")
const { spawn } = require("child_process")
const { getAllQidsThen } = require("../util")

const backupType = "question"
const baseFilePath = `../../json/${backupType}`
const backupsFilePath = `../../backups/${backupType}`

const commit = "2b9a43edbfaa054335dc191ab48b0995229a6421"

const qidSet = new Set()


/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const jsonFilePath = `${baseFilePath}/${qid}.json`

    const input = await fs.readFile(jsonFilePath, "utf-8")

    if (input.match(/https:\/\/archive\.is\/\w{5}\/\w+\.\w+/)) {
        qidSet.add(qid)
    }

}

(async () => {
    await Promise.all(
        getAllQidsThen(baseFilePath, handler)
    )

    const lost = []

    const qids = [...qidSet].filter(qid => {
        return fs.existsSync(`${backupsFilePath}/${qid}.html`) || void lost.push(qid)
    })

    const files = qids.map(qid => {
        return `./${qid}.json`
    })


    const g = spawn("git", ["checkout", commit, ...files], { cwd: baseFilePath })

    g.stdout.pipe(process.stdout)
    g.stderr.pipe(process.stdout)

    g.on("close", (code) => {
        console.log(`子进程退出码：${code}`)
    })

    console.log(lost)

    /**
     *  684,
        969,
        3800,
        4221,
        4277,
        4290,
        4297,
        4305,
        4308,
        4307,
        4317,
        4318,
        4324,
        4331,
        4396 ]
     */


})()
