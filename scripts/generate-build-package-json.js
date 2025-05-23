import fs from "fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));

// remove unnecessary fields
delete packageJson.scripts;
delete packageJson.devDependencies;
delete packageJson.dependencies;
delete packageJson.packageManager;
delete packageJson.imports;

// change modified fields
packageJson.type = "commonjs";

// add new fields
packageJson.bin = {
  devhost: "dist/index.cjs",
};

packageJson.author = "Xiao Ynag";
packageJson.description = "Devhost cli";
packageJson.homepage = "https://suntzu.me/devhost";
packageJson.keywords = ["proxy", "development"];

fs.writeFileSync(
  "build/package.json",
  JSON.stringify(packageJson, null, 2),
  "utf-8"
);
