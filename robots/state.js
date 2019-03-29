const fs = require('fs')
const contentFilePath = './content.json'

function save(content) {
    const contenString = JSON.stringify(content)
    return fs.writeFileSync(contentFilePath, contenString)
}
function load() {
    const fileBuffer = fs.readFileSync(content, 'utf-8')
    const contentJson = JSON.parse(fileBuffer)
    return contentJson
}

module.exports = {
    save, load
}