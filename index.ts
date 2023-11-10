import express from "express";
import {Request, Response} from "express";
import * as redis from "redis";
import axios from "axios";
// import {promisify} from "util";

const app = express();
const PORT = 3000;
const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});
redisClient.on('error', (err) => {
    console.log('Redis Error: ' + err);
});
(async () => {
    await redisClient.connect();
})();

// const getAsync = promisify(redisClient.get).bind(redisClient);
// const setAsync = promisify(redisClient.set).bind(redisClient);

app.get("/photos", async (req: Request, res: Response) => {
    // key to store results in Redis store
    const photosRedisKey = 'photos';
    // Try fetching the result from Redis first in case we have it cached
    try {
        const cachedPhoto = await redisClient.get(photosRedisKey);
        if (cachedPhoto) {
            return res.status(200).json({
                data: JSON.parse(cachedPhoto),
                source: "cache"
            });
        }
        const photo = await axios.get("https://jsonplaceholder.typicode.com/photos");
        await redisClient.set(photosRedisKey, JSON.stringify(photo.data), {
            EX: 3600
        });
        return res.status(200).json({
            data: photo.data,
            source: "database"
        });
    } catch (err) {
        return res.status(500).json({
            error: err
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
