import SparkMD5 from "spark-md5";

const baseUrl = "http://localhost:8080/"
const WorkerNum = navigator.hardwareConcurrency || 4

type chunk= {
    start: number,
    end: number,
    index: number,
    blob: Blob,
    md5: string
}

export const fileExit = async (md5Code: string): Promise<any> => {
    const request = new XMLHttpRequest()
    request.responseType = "json"
    request.open("get", baseUrl + `fileExit?md5=` + md5Code, true)
    request.send()
    request.onreadystatechange = () => {

        if (request.status === 200 && request.readyState === 4) {
            return new Promise((resolve) => {

                resolve(request.response)
            })
        } else {

            new Error('网络错误')
        }
    }
}

const uploadChunk = async (fileChunk: any, md5Code: string, fileName: String, chunkNum: number) => {
    return new Promise(async (resolve) => {
        if (!await chunkExist(fileChunk.md5)) {
            const request = new XMLHttpRequest()
            request.open("post", baseUrl + `uploadChunk?md5code=${md5Code}&filename=${fileName}&chunkNum=${chunkNum}`, true)
            request.send(JSON.stringify(fileChunk))
            request.onreadystatechange = () => {

                if (request.status === 200 && request.readyState === 4) {
                    if (request.response.code === 400) {
                        request.send(JSON.stringify(fileChunk))
                    } else {

                        resolve(request.response)
                    }
                } else {
                    new Error('网络错误')
                }

            }
        }

    })
}
const chunkExist = async (md5Code: string): Promise<any> => {
}

export const uploadFile = async (cutChunksList: any[], md5Code: string, fileName: string, startIndex: number) => {

    const prosQueue = []
    const limitNum = 5
    let activeTaskList = []

    for (let i = startIndex; i < cutChunksList.length; i++) {
        const chunk = cutChunksList[i]
        prosQueue.push(uploadChunk(chunk, md5Code, fileName, cutChunksList.length))
    }

    while (prosQueue.length > 0) {

        if (activeTaskList.length < limitNum) {
            const task = prosQueue.shift()!
            activeTaskList.push(task)
            task.then(async () => {

                activeTaskList.splice(activeTaskList.indexOf(task), 1)
            })
        }

        if (activeTaskList.length >= limitNum) {
            await Promise.race(activeTaskList)
        }
    }
}

export const getFileMd5 = async (file: File): Promise<string> => {
    return new Promise(async (resolve,) => {
        const spark = new SparkMD5.ArrayBuffer()
        const chunkSize = 1024 * 1024 * 5
        const chunkNum = Math.ceil(file.size / chunkSize)
        const proms = []
        for (let i = 0; i < chunkNum; i++) {
            const blob = file.slice(i * chunkSize, (i + 1) * chunkSize)
            proms.push(new Promise((resolve, reject) => {
                const fileReader = new FileReader()
                fileReader.readAsArrayBuffer(blob)
                fileReader.onload = (e) => {
                    try {
                        spark.append(e.target?.result as ArrayBuffer)
                        resolve(null)
                    } catch (e) {
                        reject(e)
                    }
                }
            }))
        }
        await Promise.all(proms)
        resolve(spark.end())
    })
}

export const cutFile = async (file: File): Promise<chunk[]> => {
    return new Promise((resolve) => {
        const result: chunk[] = []
        const ChunkSize = 1024 * 1024 * 5
        const ChunkNum = Math.ceil(file.size / ChunkSize)
        const threadChunkNum = Math.ceil(ChunkNum / WorkerNum)
        let count = 0
        for (let i = 0; i < WorkerNum; i++) {
            const start = i * threadChunkNum
            let end = (i + 1) * threadChunkNum
            if (end > ChunkNum) {
                end = ChunkNum
            }

            const worker = new Worker("src/utils/file/worker.js", {
                type: "module"
            })

            worker.postMessage({
                file, ChunkSize, start: start, end: end
            })

            worker.onmessage = async function (e) {
                for (let i = start; i < end; i++) {
                    result[i] = e.data[i - start]
                }
                worker.terminate()
                count++
                if (count === WorkerNum) {
                    resolve(result)
                }
            }
        }
    })
}

