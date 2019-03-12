//  importação do módulo do algorithmia
const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizaContent(content)
    breakContentIntoSentences(content)

    async function fetchContentFromWikipedia(content) {
        //  Retorna instancia autenticada do algorítmo
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        //  Retorna uma instancia do algoritmo do Wikipedia
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        //  Function 'pipe' faz uma busca no wikipedia con o conteúdo especificado
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
        //  Retorna o valor da requisição feita
        const wikipediaContent = wikipediaResponde.get()

        //  Pegando somente o atributo "content" da resposta do wiipedia e 
        //  atribuindo à estrutura de dados
        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizaContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarckdown(content.sourceContentOriginal)
        const whitoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
        content.sourceContentSanitized = whitoutDatesInParentheses

        function removeBlankLinesAndMarckdown(text) {
            const allLines = text.split('\n')
            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            })
            return withoutBlankLinesAndMarkdown.join('')
        }

        function removeDatesInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
        }
    }

    function breakContentIntoSentences(content) {
        content.sentences = []
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
        console.log(sentences)
    }
}

module.exports = robot