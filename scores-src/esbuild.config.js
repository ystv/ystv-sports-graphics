module.exports = {
  entryPoints: [
    "./src/server/index.server.ts",
    "./src/server/rosesLiveSync.ts",
  ],
  platform: "node",
  target: ["node16"],
  treeShaking: true,
  sourcemap: true,
  bundle: true,
  loader: {
    ".node": "copy",
  },
  outdir: "./dist",
  external: ["argon2", "couchbase"],
};
