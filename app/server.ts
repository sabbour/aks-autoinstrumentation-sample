// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/*********************************************************************
 *  OPEN TELEMETRY SETUP
 **********************************************************************/

// Open Telemetry setup need to happen before instrumented libraries are loaded
import * as http from "http";
import * as mysql from "mysql";

/*********************************************************************
 *  MYSQL SETUP
 **********************************************************************/
/** Connect to MySQL DB. */
const mysqlHost = process.env["MYSQL_HOST"] || "localhost";
const mysqlUser = process.env["MYSQL_USER"] || "root";
const mysqlPassword = process.env["MYSQL_PASSWORD"] || "secret";
const mysqlDatabase = process.env["MYSQL_DATABASE"] || "my_db";

const connection = mysql.createConnection({
  host: mysqlHost,
  user: mysqlUser,
  password: mysqlPassword,
  database: mysqlDatabase,
});

connection.connect((err: any) => {
  if (err) {
    console.log("Failed to connect to DB, err:" + err);
  }
  else {
    console.info("MySQL connnected");
  }
});

function handleConnectionQuery(response: any) {
  try {
    const query = 'SELECT 1 + 1 as solution';
    connection.query(query, (err: any, results: any, _fields: any) => {
      if (err) {
        console.log('Error code:', err.code);
        response.end(err.message);
      } else {
        response.end(`${query}: ${results[0].solution}`);
      }
    });
  } catch (error) {
    response.end("MySQL error: " + error);
  }
}

/*********************************************************************
 *  MONGO SETUP
 **********************************************************************/
const { MongoClient } = require("mongodb");
const mongoHost = process.env["MONGO_HOST"] || "mongo";
const uri = "mongodb://root:example@" + mongoHost +":27017/";
let mongoClient: any;

async function handleMongoConnection(response: any) {
  try {
    const myDB = mongoClient.db("myStateDB");
    const myColl = myDB.collection("states");
    const docs = [
       { state: "Washington", coast: "west" },
       { state: "New York", shape: "east" },
       { state: "South Carolina", shape: "east" }
    ];
    const insertManyresult = await myColl.insertMany(docs);
    let ids = insertManyresult.insertedIds;
    console.log(`${insertManyresult.insertedCount} documents were inserted.`);
    for (let id of Object.values(ids)) {
      response.end(`Inserted a document with id ${id}`);
    }
  } catch (error) {
    console.error("Error: " + error);
    response.end("Error code: ", error.code);
  }
}

try {
  mongoClient = MongoClient.connect(uri);
  console.log("Connected to Mongo");
} catch (error) {
  console.error("Mongo error: " + error);
}
/*********************************************************************
 *  POSTGRES SETUP
 **********************************************************************/
let postgresUser = process.env["POSTGRES_USER"] || "admin";
let postgresHost = process.env["POSTGRES_HOST"] || "localhost";
let postgresDatabase = process.env["POSTGRES_DB"] || "test_db";
let postgresPassword = process.env["POSTGRES_PASSWORD"] || "mypassword";
let postgresPort = process.env["POSTGRES_PORT"] || 5432;

const { Client } = require('pg');
const pgClient = new Client({
  user: postgresUser,
  host: postgresHost,
  database: postgresDatabase,
  password: postgresPassword,
  port: postgresPort,
});
pgClient.connect();
console.log("Connected to Postgres");

function handlePostgresConnection(response: any) {
  try {
    pgClient.query('SELECT NOW()', (err: any, res: any) => {
      response.end(`Postgres connected and queried at ${res.rows[0].now}`)
    });
  } catch (error) {
    response.end("Postgres error: " + error);
  }
}
/*********************************************************************
 *  REDIS SETUP
 **********************************************************************/
const { createClient } = require('redis');
const redisClient = createClient();
try {
  redisClient.connect();
  console.log("Connected to Redis");
} catch (error) {
  console.error("Redis error: " + error);
}

async function handleRedisConnection(response: any) {
  try {
    await redisClient.set('mykey', 'Hello from node redis');
    const myKeyValue = await redisClient.get('mykey');
    console.log(myKeyValue);

    const numAdded = await redisClient.zAdd('vehicles', [
      {
        score: 4,
        value: 'car',
      },
      {
        score: 2,
        value: 'bike',
      },
    ]);
    response.end(`Added ${numAdded} items.`);
  } catch (error) {
    response.end("Error: " + error);
  }
}
/*********************************************************************
 *  HTTP SERVER SETUP
 **********************************************************************/
/** Starts a HTTP server that receives requests on sample server port. */
let server: http.Server;
function startServer(port: number) {
  console.log(`Starting HTTP server`);
  // Creates a server
  server = http.createServer(handleRequest);
  // Starts the server
  try {
    server.listen(port, () => {
      console.log(`Node HTTP listening on ${port}`);
    });
  }
  catch (error) {
    console.error("HTTP error: " + error);
  }
}

/** A function which handles requests and send response. */
function handleRequest(request: any, response: any) {


  const body = [];
  request.on("error", (err: Error) => console.log(err));
  request.on("data", (chunk: string) => body.push(chunk));
  request.on("end", () => {

    if (request.url == '/') {
      response.end("Hello World!");
    }
    else if (request.url == '/mysql') {
      handleConnectionQuery(response);
    }
    else if (request.url == '/mongo') {
      handleMongoConnection(response);
    }
    else if (request.url == '/postgres') {
      handlePostgresConnection(response);
    }
    else if (request.url == '/redis') {
      handleRedisConnection(response);
    }
    else if (request.url == '/http') {
      http.get(
        {
          host: "bing.com"
        },
        (res) => {
          const body: any = [];
          res.on("data", (chunk) => body.push(chunk));
          res.on("end", () => {
            response.end("Done");
          });
        }
      );
    }
   if (request.url == '/exception') {
      let req = http.get(
        {
          host: "test.com",
          port: "65530"
        },
        (res) => {
          const body: any = [];
          res.on("data", (chunk) => body.push(chunk));
          res.on("end", () => {
            response.end("Done");
          });
        }
      );
      setTimeout(() => {
        this._requestTimedOut = true;
        req.abort();
      }, 2000);

      req.on("error", (error: Error) => {
        response.end("Done");
      });
      req.end();
    }
  });
}

startServer(8080);

