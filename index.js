const robots = {
    input: require('./robots/inputs.js'),
    text: require('./robots/text.js')
}

async function start() {

    robots.input()
    //await robots.text(content)

    console.log(content)
}

start()