const esbuild = require("esbuild");
const child_process = require("child_process");

/** @type {ReturnType<child_process.fork> | null} */
let proc = null;

function start() {
    proc = child_process.fork("./dist/index.server.js");
    proc.once("spawn", () => {
        console.log("Server started.")
    });
}

function startOrRestart() {
    if (proc !== null) {
        console.log("Killing server...")
        proc.on("exit", function() {
            proc = null;
            start();
        });
        proc.kill();
    } else {
        start();
    }
}

esbuild.build({
    entryPoints: ["./src/server/index.server.ts"],
    platform: "node",
    target: ["node16"],
    treeShaking: true,
    sourcemap: false,
    watch: {
        onRebuild(err, res) {
            if (err) {
                console.error("\n\n\nBUILD FAILED!");
                console.error(err);
                console.error("\n\n\n");
                return;
            }
            startOrRestart();
        }
    },
    bundle: true,
    outfile: "./dist/index.server.js"
}).then(() => {
    console.log("Build complete. Watching for changes...");
    startOrRestart();
})
