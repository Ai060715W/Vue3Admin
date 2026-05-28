import SparkMD5 from "spark-md5";

export const createChunk = async (file, index, ChunkSize) => {
    return new Promise((resolve, reject) => {

        const start = index * ChunkSize;

        const end = start + ChunkSize;

        const spark = new SparkMD5.ArrayBuffer();

        const reader = new FileReader();

        const blob = file.slice(start, end);

        reader.onload = (e) => {

            spark.append(e.target.result);

            resolve({
                start,
                end,
                index,
                blob,
                md5: spark.end()
            });
        };

        reader.readAsArrayBuffer(blob);
    });
};
