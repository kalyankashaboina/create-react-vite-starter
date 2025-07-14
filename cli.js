#!/usr/bin/env node

import { execSync } from "child_process";
import chalk from "chalk";
import {
  existsSync,
  rmSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  statSync,
} from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project name from CLI
const projectName = process.argv[2];

if (!projectName) {
  console.log(
    chalk.red("❌ Please specify a project name:\n") +
      chalk.yellow("👉 npx create-react-vite-app <project-name>")
  );
  process.exit(1);
}

const templateDir = path.join(__dirname, "template");
const targetDir = path.join(process.cwd(), projectName);

// Check if target directory already exists
if (existsSync(targetDir)) {
  console.log(
    chalk.red(`❌ Directory "${projectName}" already exists.`) +
      chalk.gray(" Please choose a different name.")
  );
  process.exit(1);
}

// Step 1: Create the project directory
console.log(chalk.blueBright("\n🚀 Creating React + Vite Starter Template..."));
console.log(chalk.green(`📁 Creating project: ${projectName}\n`));
mkdirSync(targetDir);

// Step 2: Copy template recursively
const copyRecursive = (src, dest) => {
  mkdirSync(dest, { recursive: true });
  readdirSync(src).forEach((file) => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    if (statSync(srcFile).isDirectory()) {
      copyRecursive(srcFile, destFile);
    } else {
      copyFileSync(srcFile, destFile);
    }
  });
};

copyRecursive(templateDir, targetDir);

// Step 3: Clean up if needed
const nodeModulesPath = path.join(targetDir, "node_modules");
if (existsSync(nodeModulesPath))
  rmSync(nodeModulesPath, { recursive: true, force: true });

const lockFilePath = path.join(targetDir, "package-lock.json");
if (existsSync(lockFilePath)) rmSync(lockFilePath);

// Step 4: Install dependencies
console.log(chalk.cyan("📦 Installing dependencies...\n"));
execSync("npm install", { stdio: "inherit", cwd: targetDir });

// ✅ Done
console.log(chalk.greenBright("\n✅ Project created successfully!"));
console.log(
  chalk.white(`👉 Next steps:`) +
    `\n   ${chalk.cyan(`cd ${projectName}`)}\n   ${chalk.cyan("npm run dev")}\n`
);
