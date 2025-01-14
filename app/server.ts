import * as http from "http";
import * as mysql from "mysql";

let mysqlClient: any;
let server: http.Server;
let mongoClient: any;
let pgClient: any;
let redisClient: any;

/**
 * Initializes connections to various databases and starts the server.
 * 
 * This function performs the following steps:
 * 1. Connects to a MySQL database.
 * 2. Connects to a MongoDB database.
 * 3. Connects to a PostgreSQL database.
 * 4. Connects to a Redis database.
 * 5. Starts the server on port 8080.
 * 
 * @returns {Promise<void>} A promise that resolves when the server has started.
 */
async function run() {
  mysqlClient = await connectToMySQL();
  mongoClient = await connectToMongo();
  pgClient = await connectToPostgres();
  redisClient = await connectToRedis();
  const port = 8080;
  startServer(port);
}

run();

/**
 * Establishes a connection to a MySQL database using environment variables for configuration.
 * 
 * @returns {Promise<any>} A promise that resolves with the MySQL connection object if successful, 
 *                         or rejects with an error if the connection fails.
 * 
 * Environment Variables:
 * - `MYSQL_HOST`: The hostname of the MySQL server (default: "localhost").
 * - `MYSQL_USER`: The username for the MySQL connection (default: "root").
 * - `MYSQL_PASSWORD`: The password for the MySQL connection (default: "secret").
 * - `MYSQL_DATABASE`: The name of the MySQL database to connect to (default: "").
 */
async function connectToMySQL() {
  const mysqlHost = process.env["MYSQL_HOST"] || "localhost";
  const mysqlUser = process.env["MYSQL_USER"] || "root";
  const mysqlPassword = process.env["MYSQL_PASSWORD"] || "secret";
  const mysqlDatabase = process.env["MYSQL_DATABASE"] || "";

  const connection = mysql.createConnection({
    host: mysqlHost,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase,
  });

  return new Promise((resolve, reject) => {    
    console.log("Connecting to MySQL");
    connection.connect((err: any) => {
      if (err) {
        console.error("MySQL error: " + err);
        reject(err);
      } else {
        console.info("MySQL connected");
        resolve(connection);
      }
    });
  });
}

/**
 * Establishes a connection to a MongoDB instance using the MongoClient from the 'mongodb' package.
 * 
 * @returns {Promise<any>} A promise that resolves with the MongoDB client object if successful,
 *                         or rejects with an error if the connection fails.
 */
async function connectToMongo() {
  const { MongoClient } = require("mongodb");
  const mongoHost = process.env["MONGO_HOST"] || "mongo";
  const mongoUri = "mongodb://" + mongoHost + ":27017/";
  const mongoClient = new MongoClient(mongoUri);

  try {
    console.log("Connecting to Mongo");
    await mongoClient.connect();
    console.info("Connected to Mongo");
    return mongoClient;
  } catch (error) {
    console.error("Mongo error: " + error);
    throw error;
  }
}

/**
 * Establishes a connection to a PostgreSQL database using environment variables for configuration.
 * 
 * @returns {Promise<any>} A promise that resolves with the PostgreSQL client object if successful,
 *                         or rejects with an error if the connection fails.
 * 
 * Environment Variables:
 * - `POSTGRES_USER`: The username for the PostgreSQL database (default: "admin").
 * - `POSTGRES_HOST`: The host address of the PostgreSQL database (default: "localhost").
 * - `POSTGRES_DB`: The name of the PostgreSQL database (default: "test_db").
 * - `POSTGRES_PASSWORD`: The password for the PostgreSQL database (default: "mypassword").
 * - `POSTGRES_PORT`: The port number for the PostgreSQL database (default: 5432).
 */
async function connectToPostgres() {
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
  console.log("Connecting to Postgres");
  try {
    await pgClient.connect();
    console.info("Connected to Postgres");
    return pgClient;
  } catch (error) {
    console.error("Postgres error: " + error);
    throw error;
  }
}

/**
 * Establishes a connection to a Redis server.
 * 
 * @returns {Promise<any>} A promise that resolves with the Redis client object if successful,
 *                         or rejects with an error if the connection fails.
 */
async function connectToRedis() {
  const { createClient } = require('redis');
  const redisClient = createClient({
    url: 'redis://redis:6379'
  });

  redisClient.on('error', (err: Error) => {
    console.log('Redis error: ', err)
    throw err;
  });
  console.log("Connecting to Redis");
  await redisClient.connect();
  console.info("Connected to Redis");
  return redisClient;
}

/**
 * Handles a MySQL connection query and sends the response.
 * 
 * @param {any} response - The HTTP response object.
 * @param {any} mysqlClient - The MySQL client object.
 */
function handleConnectionQuery(response: any, mysqlClient: any) {
  try {
    const query = 'SELECT 1 + 1 as solution';
    mysqlClient.query(query, (err: any, results: any, _fields: any) => {
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

/**
 * Handles a MongoDB connection query and sends the response.
 * 
 * @param {any} response - The HTTP response object.
 * @param {any} mongoClient - The MongoDB client object.
 */
async function handleMongoConnection(response: any, mongoClient: any) {
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
  } catch (error) {
    console.error("Error: " + error);
    response.end("Error code: ", error.code);
  }
}

/**
 * Handles a PostgreSQL connection query and sends the response.
 * 
 * @param {any} response - The HTTP response object.
 * @param {any} pgClient - The PostgreSQL client object.
 */
function handlePostgresConnection(response: any, pgClient: any) {
  try {
    pgClient.query('SELECT NOW()', (err: any, res: any) => {
      response.end(`Postgres connected and queried at ${res.rows[0].now}`)
    });
  } catch (error) {
    response.end("Postgres error: " + error);
  }
}

/**
 * Handles a Redis connection query and sends the response.
 * 
 * @param {any} response - The HTTP response object.
 * @param {any} redisClient - The Redis client object.
 */
async function handleRedisConnection(response: any, redisClient: any) {
    await redisClient.set('mykey', 'Hello from node redis');
    await redisClient.get('mykey');

    const key = 'vehicles';
    const members = [
      {
        score: 4,
        value: 'car',
      },
      {
        score: 2,
        value: 'bike',
      },
    ];

    await redisClient.zadd(key, ...members, (err: Error, numAdded: number) => {
      if (err) throw err;
      console.log(`Number of elements added: ${numAdded}`);
    });
}

/**
 * Starts an HTTP server that listens on the specified port.
 * 
 * @param {number} port - The port number on which the server will listen.
 */
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

/**
 * Handles incoming HTTP requests and sends appropriate responses.
 * 
 * @param {any} request - The HTTP request object.
 * @param {any} response - The HTTP response object.
 */
function handleRequest(request: any, response: any) {
  const body = [];
  request.on("error", (err: Error) => console.log(err));
  request.on("data", (chunk: string) => body.push(chunk));
  request.on("end", () => {

    if (request.url == '/') {
      response.end("Hello World!");
    }
    else if (request.url == '/mysql') {
      handleConnectionQuery(response, mysqlClient);
    }
    else if (request.url == '/mongo') {
      handleMongoConnection(response, mongoClient);
    }
    else if (request.url == '/postgres') {
      handlePostgresConnection(response, pgClient);
    }
    else if (request.url == '/redis') {
      handleRedisConnection(response, redisClient);
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
      const req = http.get(
        {
          host: "test.com",
          port: "65530"
        },
        (res) => {
          const body: any = [];
          res.on("data", (chunk) => body.push(chunk));
        }
      );

      req.on("error", (error: Error) => {
        response.end("Done, but with an error: " + error);
      });

      setTimeout(function() {
        req.destroy();
      }, 2000);
    }
  });
}