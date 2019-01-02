// @ts-check
const fs = require("fs-extra")

const baseFilePath = "./google_cached/"

/** @type {{ title: string; link: string; cacheId?: string; [x: string]: any; }[]} */
const results =
    fs.readdirSync(baseFilePath)
        .map((fileName) => {
            return fs.readJSONSync(baseFilePath + fileName).items
        }).reduce((p, c) => {
            return p.concat(c)
        }, [])

const allCachedPages = results.filter((r) => {
    return !!r.cacheId
})

const allCachedQids =
    allCachedPages.filter((r) => {
        return r.link.includes("question/")
    }).map((r) => {
        return +r.link.match(/question\/(\d+)/)[1]
    })

/** @type {number[]} */
const lostPages = fs.readJSONSync("./lost_pages.json")
const lostQids =
    allCachedQids.filter((qid) => {
        return lostPages.includes(qid)
    })

const output =
    lostQids.map((qid) => {
        const page = allCachedPages.find((r) => {
            return !!r.link.match(`question/${qid}`)
        })

        const { title, link, cacheId } = page

        return {
            qid,
            title,
            link,
            cacheId,
        }
    })

console.log(output)

fs.writeJSONSync("./cached_lost_pages.json", output, { spaces: 4 })


