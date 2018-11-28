

const getAvatarUrlObjs = () => {
    const anchors = [...document.querySelectorAll(".body a[href]")].filter(x => {
        return x.href.includes("https://www.mohu.club/people/")
    })

    return anchors.filter(x => {
        const imgElement = x.children[1]
        return imgElement.tagName == "IMG" && imgElement.src.includes("https://")

    }).map(x => {
        const href = x.href
        const UserNameElements = anchors.filter(y => {
            return y.href == href && y.textContent
        })
        return {
            "user-url": href.split("/").pop(),
            "user-name": UserNameElements[0] && UserNameElements[0].textContent,
            avatar: x.children[1].src,
        }
    })
}


let qid = +location.href.split("/").pop()
let all = []

for (; qid < 10; qid++) {
    all.push(...getAvatarUrlObjs())
    location.replace("https://archive.is/20181108120000/https://www.mohu.club/question/" + (qid + 1)) // 下一页
}

const output = all.sort((a, b) => {
    const userA = a["user-url"]
    const userB = b["user-url"]
    if (userA < userB) {
        return -1
    }
    if (userA > userB) {
        return 1
    }
    return 0
}).reduce((newAll, c) => {  // 数组去重 (不能用Set因为Set无法去重Object)
    const l = newAll.slice(-1)
    if (l.length > 0) {
        if (c["user-url"] && l[0]["user-url"] == c["user-url"]) {
            return newAll
        }
    }
    return newAll.concat(c)
}, [])

console.log(
    JSON.stringify(output)
)




