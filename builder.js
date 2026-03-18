const esbuild = require("esbuild");

const shared = {
  entryPoints: ["index.js"],
  bundle: true,
  minify: true,
  sourcemap: true,
};

Promise.all([
  esbuild.build({ ...shared, outfile: "dist/index.txt" }),
  esbuild.build({ ...shared, outfile: "dist/index.js" }),
]).catch(() => process.exit(1));
