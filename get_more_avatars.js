
/**
 * @typedef {{"user-url": string; "user-name": string; avatar: string;}} AvatarUrlObj
 */

/**
 * @returns {AvatarUrlObj[]}
 */
const getAvatarUrlObjs = () => {
    const anchors = [...document.querySelectorAll(".body a[href]")].filter(x => {
        return x.href.includes("https://www.mohu.club/people/")
    })

    return anchors.filter(x => {
        const imgElement = x.children[1]
        return imgElement.tagName == "IMG" && imgElement.src.includes("https://")

    }).map(x => {
        const imgElement = x.children[1]

        const href = x.href

        const UserNameElements = anchors.filter(y => {
            return y.href == href && y.textContent
        })
        
        return {
            "user-url": href.split("/").pop(),
            "user-name": imgElement.alt || UserNameElements[0] && UserNameElements[0].textContent,
            avatar: imgElement.src,
        }
    })
}

/**
 * 数组去重 (不能用Set因为Set无法去重Object)
 * @param {AvatarUrlObj[]} oldAll 
 * @returns {AvatarUrlObj[]}
 */
const dedup = (oldAll) => {
    return oldAll.sort((a, b) => {
        const userA = a["user-url"]
        const userB = b["user-url"]
        if (userA < userB) {
            return -1
        }
        if (userA > userB) {
            return 1
        }
        return 0
    }).reduce((newAll, c) => {
        const l = newAll.slice(-1)
        if (l.length > 0) {
            if (c["user-url"] && l[0]["user-url"] == c["user-url"]) {
                return newAll
            }
        }
        return newAll.concat(c)
    }, [])
}


let qid = +location.href.split("/").pop()
let all = []

for (; qid < 9; qid++) {
    all.push(...getAvatarUrlObjs())
    location.replace("https://archive.is/20181108120000/https://www.mohu.club/question/" + (qid + 1)) // 下一页
}

console.log(all)

const output = dedup(all)

console.log(output)
console.log(
    JSON.stringify(output)
)




