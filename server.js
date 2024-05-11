// server.js
const http = require('http');
const url = require('url');
const { MongoClient } = require('mongodb');

const dbUrl = 'mongodb+srv://gameputtsq362.mpgoei4.mongodb.net/';
const dbName = 'Game01';
const collectionName = 'Player';

const authuser = {
    username: 'putt',
    password: 'putt2546'
};

const authmech = 'SCRAM-SHA-1';

const options = {
    auth: authuser,
    authMechanism: authmech
};

async function connect(dbUrl, options) {
    const client = new MongoClient(dbUrl, options);
    return client.connect();
}

async function runMongo(dbUrl, options, dbName, collectionName, data) {
    const conn = await connect(dbUrl, options);

    const deleteresp = await conn.db(dbName).collection(collectionName).deleteMany({});

    const insertresp = await conn.db(dbName).collection(collectionName).insertMany(data);

    console.log(insertresp);

    await conn.close();
}

async function getUserData(dbUrl, options, dbName, collectionName, userId) {
    const conn = await connect(dbUrl, options);
    const userData = await conn.db(dbName).collection(collectionName).findOne({ player_id: userId });
    
    await conn.close();
    if (userData) {
        return {
            "code": 1,
            "player_id": userData.player_id,
            "username": userData.username,
            "level": userData.level
        };
    } else {
        return { "code": 3 , "msg": "player not found" };
    }
}

async function collectReward(dbUrl, options, dbName, collectionName, userId) {
    const conn = await connect(dbUrl, options);
    const userData = await conn.db(dbName).collection(collectionName).findOne({ player_id: userId });
    if (!userData) {
        return { "code": 3 , "msg": "player not found" };
    }
    if (userData.level > 1) {
        return { "code": 2 , "msg": "player cannot collect this rewards" };
    }
    const rewardData = [
        { "item_key": "gacha-01", "quantity": 5 },
        { "item_key": "wpn-01", "quantity": 1 }
    ];
    if (!userData.inventory) {
        userData.inventory = [];
    }
    for (let reward of rewardData) {
        let existingItem = userData.inventory.find(item => item.item_key === reward.item_key);
        if (existingItem) {
            existingItem.quantity += reward.quantity;
        } else {
            userData.inventory.push(reward);
        }
    }
    await conn.db(dbName).collection(collectionName).updateOne({ player_id: userId }, { $set: userData });
    await conn.close();
    return { "code": 1 , "msg": "player collected this rewards" };
}

const server1 = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);

    if (reqUrl.pathname.startsWith('/player/get/') && req.method === 'POST') {
        const userId = reqUrl.pathname.split('/')[3];
        getUserData(dbUrl, options, dbName, collectionName, userId)
            .then(userData => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(userData));
            })
            .catch(err => {
                console.error(err);
                res.statusCode = 404;
                res.end(JSON.stringify({"code": 4 , "msg": "nothing"}));
            });
    } else {
        // let body = [];
        // req.on('data', chunk => {
        //     body.push(chunk);
        // }).on('end', () => {
        //     body = Buffer.concat(body).toString();
        //     const payload = JSON.parse(body);

        //     // insert data into mongoDB
        //     runMongo(dbUrl, options, dbName, collectionName, payload);
        // });
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server1.listen(10001, () => {
    console.log('Server running at http://localhost:10001/');
});

const server2 = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);

    if (reqUrl.pathname === '/reward/collect' && req.method === 'POST') {
        console.log('here');
        let body = [];
        req.on('data', chunk => {
            body.push(chunk);
        }).on('end', async () => {
            body = Buffer.concat(body).toString();
            console.log('Received payload:', body);
            const userId = JSON.parse(body).player_id;
            if (!userId) {
                res.statusCode = 400;
                res.end('User ID is required');
                return;
            }
            const rewardResponse = await collectReward(dbUrl, options, dbName, collectionName, userId);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(rewardResponse));
        });
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server2.listen(10002, () => {
    console.log('Server is running at http://localhost:10002');
});


const player_data = [
    {
        "player_id": "15001",
        "username": "john",
        "level": 1
    },
    {
        "player_id": "15002",
        "username": "tony",
        "level": 9
    },
    {
        "player_id": "15003",
        "username": "kerry",
        "level": 1
    }
]
runMongo(dbUrl, options, dbName, collectionName, player_data);