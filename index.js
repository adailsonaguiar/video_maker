const robots = {
    input: require('./robots/inputs.js'),
    text: require('./robots/text.js'),
    state: require('./robots/state.js'),
  }
  
  async function start() {
    robots.input() 
    await robots.text() 
  }
  
  start()