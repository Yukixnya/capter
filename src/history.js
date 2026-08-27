// const history = [];

// export function addCommand(command,output="",error="",exitCode=0){
//     history.push({
//         id:history.length + 1,
//         command,
//         output,
//         error,
//         exitCode,
//         timestamp: new Date().toDateString()
//     });
// }

// export function getHistory() {
//     return history;
// }

import { exec } from "node:child_process";
import { error } from "node:console";
import { stderr, stdout } from "node:process";

export function getPowerHistory(){
    return new Promise((resolve,reject)=>{
        exec(
            "powershell -NoProfile -Command \"Get-History | Select-Object Id, CommandLine | ConvertTo-Json\"",
            (error,stdout,stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message));
                    return;
                }
                try{
                    const history = stdout.trim()?JSON.parse(stdout):[];
                    resolve(Array.isArray(history)?history:[history]);
                }
                catch (err) {
                    reject(err);
                }
            }
        );
    });
}