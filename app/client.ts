// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import * as http from "http";

/*********************************************************************
 *  HTTP CLIENT SETUP
 **********************************************************************/
/** A function which makes requests and handles response. */
function makeRequest(path: string) {
  const req = http.get(
    {
      host: "server",
      port: 8080,
      path: path,
    },
    (response) => {
      const body: any = [];
      response.on("data", (chunk) => body.push(chunk));
      response.on("end", () => {
        console.log(body.toString());
      });
    }
  );

  req.on("error", (err) => {
    console.error(`Request error on path ${path}:`, err);
  });
}

setInterval(() => {
  makeRequest("/");
  makeRequest("/mysql");
  //makeRequest("/mongo");
  //makeRequest("/postgres");
  //makeRequest("/redis");
  //makeRequest("/http");
  //makeRequest("/exception");
}, 3000)

