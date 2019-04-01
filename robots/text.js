//  importação do módulo do algorithmia
const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')
const watsonApiKey = require('../credentials/watson.json').apikey
const state = require('./state.js')
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

async function robot() {
    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizaContent(content)
    breakContentIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordsOfAllSentences(content)

    state.save(content)

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
    }

    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeywordsOfAllSentences(content) {
        for (const sentence of content.sentences) {
            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
        }
    }

    async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, (error, response) => {
                if (error) {
                    throw error
                }

                const keywords = response.keywords.map((keyword) => {
                    return keyword.text
                })

                resolve(keywords)
            })
        })
    }
}

module.exports = robot