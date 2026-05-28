import { createChunk } from "@/utils/file/CreateChunk.js";

onmessage = async (e) => {

    const { file, ChunkSize, start, end } = e.data;

    const proms = [];

    for (let i = start; i < end; i++) {

        proms.push(createChunk(file, i, ChunkSize));
    }

    const chunks = await Promise.all(proms);

    postMessage(chunks);
};
