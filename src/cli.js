#!/usr/bin/env node

// console.log("capter running");

// import { addCommand,getHistory } from "./history.js";

// addCommand(
//     "node app.js",
//     "Server is running at port 2000",
//     "",
//     0
// );

// addCommand(
//     "node test.js",
//     "",
//     "Error: Smt went wrong !",
//     1
// );

// console.log(getHistory());


import { startShell } from "./shell.js";
console.log("Capter is Loading");
startShell();
console.log("Capter is Active Now");