#!/usr/bin/env node

import { execSync } from "child_process";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import enquirer from "enquirer";
const { Select } = enquirer;

// Emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursively copy folder content from src to dest
const copyRecursive = (src, dest) => {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src).forEach((file) => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    if (fs.statSync(srcFile).isDirectory()) {
      copyRecursive(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
};

// Rename all .module.scss to .module.css in src and update imports
const renameScssModulesToCssModules = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      renameScssModulesToCssModules(fullPath);
    } else if (file.endsWith(".module.scss")) {
      const newFile = file.replace(/\.module\.scss$/, ".module.css");
      const newFullPath = path.join(dir, newFile);
      fs.renameSync(fullPath, newFullPath);
    }
  });
};

const updateImports = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateImports(fullPath);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");
      const updatedContent = content.replace(/(\.module)\.scss/g, "$1.css");
      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent);
      }
    }
  });
};

async function main() {
  const projectName = process.argv[2];

  if (!projectName) {
    console.log(
      chalk.red("❌ Please specify a project name:\n") +
        chalk.yellow("👉 npx create-react-vite-app <project-name>")
    );
    process.exit(1);
  }

  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.log(
      chalk.red(`❌ Directory "${projectName}" already exists.`) +
        chalk.gray(" Please choose a different name.")
    );
    process.exit(1);
  }

  const prompt = new Select({
    name: "style",
    message: "Choose styling method:",
    choices: ["scss", "css"],
  });

  let styleChoice;
  try {
    styleChoice = await prompt.run();
  } catch (err) {
    console.log(chalk.red("\n❌ Operation cancelled."));
    process.exit(1);
  }

  console.log(chalk.blueBright("\n🚀 Creating React + Vite Starter Template..."));
  console.log(chalk.green(`📁 Creating project: ${projectName}\n`));

  const cleanupOnInterrupt = () => {
    console.log(chalk.red("\n❌ Interrupted! Cleaning up..."));
    if (fs.existsSync(targetDir)) {
      try {
        fs.removeSync(targetDir);
        console.log(chalk.red(`Deleted incomplete project folder: ${projectName}`));
      } catch (error) {
        console.error(chalk.red(`Failed to delete folder: ${error.message}`));
      }
    }
    process.exit(1);
  };

  process.on("SIGINT", cleanupOnInterrupt);

  try {
    // Copy template files
    const templateDir = path.join(__dirname, "template");
    copyRecursive(templateDir, targetDir);

    const stylesDir = path.join(targetDir, "src", "styles");
    const srcDir = path.join(targetDir, "src");

    if (styleChoice === "css") {
      if (fs.existsSync(stylesDir)) {
        // Delete all .scss files in styles
        fs.readdirSync(stylesDir).forEach((file) => {
          const fullPath = path.join(stylesDir, file);
          if (file.endsWith(".scss")) {
            fs.removeSync(fullPath);
          }
        });

        // Remove variables.scss and placeholders.scss if still there
        ["variables.scss", "placeholders.scss"].forEach((f) => {
          const p = path.join(stylesDir, f);
          if (fs.existsSync(p)) fs.removeSync(p);
        });

        // Remove old variables.css and placeholders.css if any
        ["variables.css", "placeholders.css"].forEach((f) => {
          const p = path.join(stylesDir, f);
          if (fs.existsSync(p)) fs.removeSync(p);
        });

        // *** WRITE app.css AT THE ROOT OF src ***
        const appCssPath = path.join(srcDir, "app.css");

        const cssVariables = `:root {
  --primary-color: #007acc;
  --primary-color-dark: #005f99;
  --secondary-color: #6c757d;
  --secondary-color-dark: #5a6268;
  --text-color: #212529;
  --text-muted: #6c757d;
  --white: #ffffff;
  --black: #000000;
  --background-light: #f8f9fa;
  --background-dark: #343a40;
  --error-color: #dc3545;
  --success-color: #28a745;

  --font-base: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-weight-normal: 400;
  --font-weight-bold: 600;

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  --border-radius-sm: 4px;
  --border-radius: 6px;
  --border-radius-lg: 12px;
  --box-shadow-light: 0 2px 4px rgba(0, 0, 0, 0.1);
  --box-shadow-heavy: 0 4px 10px rgba(0, 0, 0, 0.2);
}
`;
        fs.writeFileSync(appCssPath, cssVariables);

        // Rename all .module.scss to .module.css in src
        renameScssModulesToCssModules(srcDir);

        // Update all imports from .module.scss to .module.css in .tsx/.ts files
        updateImports(srcDir);
      }

      // Remove SCSS preprocessor options from vite.config.ts if present
      const viteConfigPath = path.join(targetDir, "vite.config.ts");
      if (fs.existsSync(viteConfigPath)) {
        let viteConfigContent = fs.readFileSync(viteConfigPath, "utf-8");
        viteConfigContent = viteConfigContent.replace(
          /css:\s*{\s*preprocessorOptions:\s*{\s*scss:\s*{[^}]*}\s*}\s*},?/gm,
          ""
        );
        fs.writeFileSync(viteConfigPath, viteConfigContent);
      }

      // Optional: note to uninstall sass package manually
      console.log(
        chalk.yellow(
          "\n⚠️ Remember to uninstall 'sass' package manually if it is installed:\n" +
            chalk.cyan("npm uninstall sass") +
            "\n"
        )
      );
    }

    if (styleChoice === "scss") {
      if (fs.existsSync(stylesDir)) {
        // Delete all .css files except index.css and app.css
        fs.readdirSync(stylesDir).forEach((file) => {
          if (file.endsWith(".css") && file !== "index.css" && file !== "app.css") {
            fs.removeSync(path.join(stylesDir, file));
          }
        });
        // variables.scss and placeholders.scss remain
        // app.css and index.css remain
      }
      // No vite.config.ts modification needed
    }

    // Cleanup node_modules and lockfiles
    const nodeModulesPath = path.join(targetDir, "node_modules");
    if (fs.existsSync(nodeModulesPath)) {
      fs.removeSync(nodeModulesPath);
    }
    ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"].forEach((lockFile) => {
      const lockFilePath = path.join(targetDir, lockFile);
      if (fs.existsSync(lockFilePath)) {
        fs.removeSync(lockFilePath);
      }
    });

    console.log(chalk.cyan("\n📦 Installing dependencies...\n"));
    execSync("npm install", { stdio: "inherit", cwd: targetDir });

    process.removeListener("SIGINT", cleanupOnInterrupt);

    console.log(chalk.greenBright("\n✅ Project created successfully!"));
    console.log(
      chalk.white("👉 Next steps:") +
        `\n   ${chalk.cyan(`cd ${projectName}`)}\n   ${chalk.cyan("npm run dev")}\n`
    );
  } catch (error) {
    cleanupOnInterrupt();
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

main();
