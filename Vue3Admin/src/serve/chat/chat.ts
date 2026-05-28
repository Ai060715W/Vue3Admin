import { getToken } from "@/utils/cache/cookies"

const BASE_URL = 'http://localhost:3000/'

const getHeaders = (): HeadersInit => ({
    'authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    'x-refresh-token': localStorage.getItem('reFlushToken') || '',
})

export const chatStream = async (
    msg: string,
    onChunk: (text: string) => void,
    onDone?: (fullText: string) => void,
    onError?: (error: Error) => void
): Promise<void> => {
    let fullText = ''

    try {
        const response = await fetch(`${BASE_URL}chat`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content: msg }),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('无法获取响应流')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { value, done } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith(':')) continue

                if (trimmed === 'data: [DONE]') {

                    break
                }

                if (trimmed.startsWith('data: [ERROR]')) {
                    const errMsg = trimmed.substring(14).trim()
                    throw new Error(errMsg || 'AI 服务错误')
                }

                if (trimmed.startsWith('data: ')) {
                    try {
                        const jsonStr = trimmed.substring(6)
                        const data = JSON.parse(jsonStr)
                        const content = data.choices?.[0]?.delta?.content
                        if (content) {
                            fullText += content
                            onChunk(content)
                        }
                    } catch {

                    }
                }
            }
        }

        if (fullText) {
            fetch(`${BASE_URL}finish`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ content: fullText }),
            }).catch(() => {})
        }

        onDone?.(fullText)

    } catch (error) {
        console.error('[DeepSeek Chat Error]:', error)
        onError?.(error as Error)
    }
}

export const leaveSession = async (): Promise<void> => {
    await fetch(`${BASE_URL}leave`, {
        method: 'POST',
        headers: getHeaders(),
    })
}

export const getSessionToken = async (): Promise<string> => {
    const response = await fetch(`${BASE_URL}getToken`, {
        method: 'GET',
        headers: getHeaders(),
    })
    return response.text()
}

export const chat = async (msg: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        chatStream(
            msg,
            () => {},
            (fullText) => resolve(fullText),
            (error) => reject(error)
        )
    })
}