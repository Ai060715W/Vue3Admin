
const OpenAi = require('openai')
const config = require('config')

const client = new OpenAi({
    apiKey: config.get('DeepSeekConfig.apiKey'),
    baseURL: config.get('DeepSeekConfig.baseURL'),
})

const chat = async (prompt, history) => {
    try {

        if (history.length >= 9) {

            history.splice(1, history.length - 9)
        }
        history.push({ role: "user", content: prompt })

        return client.chat.completions.create({
            model: config.get('DeepSeekConfig.model'),
            messages: history,
            stream: true,
            temperature: config.get('DeepSeekConfig.temperature'),
            max_tokens: config.get('DeepSeekConfig.maxTokens'),
        })
    } catch (err) {
        console.error('DeepSeek API 调用错误:', err)
        throw err
    }
}

module.exports = chat