/* eslint-disable */
const esbuild = require("esbuild");
const child_process = require("child_process");

/** @type {ReturnType<child_process.fork> | null} */
let proc = null;
let dead = true;

function start() {
  dead = false;
  proc = child_process.fork("./dist/index.server.js", {
    execArgv: ["--enable-source-maps"],
  });
  proc.once("spawn", () => {
    console.log("Server started.");
  });
  proc.on("exit", (code) => {
    console.log("Server exited with code " + code);
    dead = true;
  });
}

function startOrRestart() {
  if (!dead) {
    console.log("Killing server...");
    proc.on("exit", function () {
      proc = null;
      start();
    });
    proc.kill();
  } else {
    start();
  }
}

esbuild
  .build({
    ...require("./esbuild.config"),
    watch: {
      onRebuild(err, res) {
        if (err) {
          console.error("\n\n\nBUILD FAILED!");
          console.error(err);
          console.error("\n\n\n");
          return;
        }
        startOrRestart();
      },
    },
  })
  .then(() => {
    console.log("Build complete. Watching for changes...");
    startOrRestart();
  });
