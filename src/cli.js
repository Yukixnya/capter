#!/usr/bin/env node

// import { addCommand, getHistory } from "./history.js";

// for (let i=1; i<=21; i++){
//     addCommand(`command-${i}`,`output-${i}`);
// }

// const history = getHistory();

// console.log("Stored Commands:",history.length);
// console.log("First Command History:",history[0]);
// console.log("Last Command History:",history[history.length-1]);



import { startShell } from "./shell.js";
console.log("Capter is Loading");
startShell();
console.log("Capter is Active Now");