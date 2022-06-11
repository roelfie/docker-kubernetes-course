const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
})
pgClient.on("connect", (client) => {
    client
        .query("CREATE TABLE IF NOT EXISTS values (number INT)")
        .catch((err) => console.error(err));
});

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express Route Handlers
app.get('/', (req, res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query("SELECT * FROM values")
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    })
})

const MAX_ALLOWED_FIB_NR = 100;

app.post('/values', async (req, res) => {
    const position = req.body.index;

    if (parseInt(position) > MAX_ALLOWED_FIB_NR) {
        return res.status(422).send(`Calculating Fibonacci at position > ${MAX_ALLOWED_FIB_NR} too expensive.`);
    }
    redisClient.hset('values', position, 'Calculating...'); // worker will calculate value in the background
    redisPublisher.publish('insert', position);
    pgClient.query('INSERT INTO values (number) VALUES ($1)', [position]);

    res.send({accepted: true}); // tell client that Fibonacci number was accepted (but not yet calculated).
})

app.listen(5000, err => {
   console.log("Client listening on port 5000")
});