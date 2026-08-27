import {exec} from "node:child_process";
import { stderr, stdout } from "node:process";

exec("node --vesion", (error,stdout,stderr) =>{
    console.log("COMMAND:");
    console.log("node --version");

    console.log("\nOUTPUT:");
    console.log(stdout);

    console.log("\nERROR:");
    console.log(stderr);

    console.log("\nEXIT CODE:");
    console.log(error?error.code:0);
});