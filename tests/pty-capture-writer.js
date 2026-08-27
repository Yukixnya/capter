import fs from "fs";

export function saveCap(data,exitCode){
    fs.mkdirSync("./temp", { recursive: true });
    fs.writeFileSync(
        "./temp/pty-capture.json",
        JSON.stringify({
            exitCode,
            capData:data
        }, null,2),"utf8"
    );
}