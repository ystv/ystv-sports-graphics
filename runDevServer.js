const esbuild = require("esbuild");
const child_process = require("child_process");
const path = require("path");

/** @type {child_process.ChildProcess | null} */
let proc = null;

function run() {
    proc = child_process.fork(
        path.join(__dirname, "build", "index.server.js"),
        {
          env: {
            NODE_ENV: "development"
          }
        }
    );
    proc.on("exit", code => {
      console.warn(`RUNNER: server exited with code ${code}`);
    });
}

function runOrRestart() {
    if (proc !== null) {
        if (proc.killed || proc.exitCode !== null) {
          run();
        } else {
          proc.kill();
          proc.on("close", () => {
              run();
          })
        }
    } else {
        run();
    }
}

const nativeNodeModulesPlugin = {
    name: 'native-node-modules',
    setup(build) {
      // If a ".node" file is imported within a module in the "file" namespace, resolve 
      // it to an absolute path and put it into the "node-file" virtual namespace.
      build.onResolve({ filter: /\.node$/, namespace: 'file' }, args => ({
        path: require.resolve(args.path, { paths: [args.resolveDir] }),
        namespace: 'node-file',
      }))
  
      // Files in the "node-file" virtual namespace call "require()" on the
      // path from esbuild of the ".node" file in the output directory.
      build.onLoad({ filter: /.*/, namespace: 'node-file' }, args => ({
        contents: `
          import path from ${JSON.stringify(args.path)}
          try { module.exports = require(path) }
          catch {}
        `,
      }))
  
      // If a ".node" file is imported within a module in the "node-file" namespace, put
      // it in the "file" namespace where esbuild's default loading behavior will handle
      // it. It is already an absolute path since we resolved it to one above.
      build.onResolve({ filter: /\.node$/, namespace: 'node-file' }, args => ({
        path: args.path,
        namespace: 'file',
      }))
  
      // Tell esbuild's default loading behavior to use the "file" loader for
      // these ".node" files.
      let opts = build.initialOptions
      opts.loader = opts.loader || {}
      opts.loader['.node'] = 'file'
    },
  }

esbuild.build({
    entryPoints: ["./src/index.server.ts"],
    outfile: "./build/index.server.js",
    bundle: true,
    treeShaking: true,
    platform: "node",
    plugins: [nativeNodeModulesPlugin],
    external: ["couchbase"],
    watch: {
        onRebuild(error, result) {
            if (error) {
                console.error("RUNNER: Watch build failed!", error);
                return;
            }
            console.log("RUNNER: Got change, restarting...");
            runOrRestart();
        }
    }
}).then(() => {
    runOrRestart();
    console.log("RUNNER: Running and watching for changes.");
})
