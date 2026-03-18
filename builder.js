const esbuild = require("esbuild");

const shared = {
  entryPoints: ["app.js"],
  bundle: true,
  minify: true,
  sourcemap: true,
};

Promise.all([
  esbuild.build({ ...shared, outfile: "dist/app.txt" }),
  esbuild.build({ ...shared, outfile: "dist/app.js" }),
]).catch(() => process.exit(1));
