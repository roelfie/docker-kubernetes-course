const express = require('express');
const redis = require('redis');
const process = require('process');

const PORT = 8081;
const REDIS_PORT = 6379
// We can refer to the redis server by its docker-compose service name:
const REDIS_SERVICE_NAME = 'redis-server'

const app = express();
const client = redis.createClient({
    url: `redis://default:default@${REDIS_SERVICE_NAME}:${REDIS_PORT}`
});

async function initRedisClient() {
    await client.connect();
    await client.set('visits', 0);
}

initRedisClient()
    .catch((err) => console.log('Redis connection error: ' + err));

app.get('/', async (req, res) => {
    const visits = await client.get('visits')
    process.exit(1)
    res.send(`Number of visits is ${visits}`);
    await client.set('visits', parseInt(visits) + 1);
});


app.listen(PORT, () => {
    console.log('Listening on port ' + PORT);
})
