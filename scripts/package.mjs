#!/usr/bin/env node
// 本地打包：把 extension/ 压成可上传 Chrome 网上应用店的 zip。
// 正式发布由 .github/workflows/release.yml 完成，这里产出的是同一个东西，
// 供上传前自测。开发时不需要跑它 —— 「加载已解压的扩展程序」直接选 extension/。
//
// extension/ 里的每个文件都该进包，所以整个目录直接打，没有排除清单要维护。
// 在目录里面打包，zip 根目录直接就是 manifest.json —— 商店只认 manifest 在根的，
// 多套一层就判「找不到 manifest」。
//
// 用法:  node scripts/package.mjs
// 产物:  dist/hotkey-chain-v<ver>.zip

import { readFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "extension");
const version = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8")).version;
const distRoot = join(root, "dist");
const zipPath = join(distRoot, `hotkey-chain-v${version}.zip`);

if (!existsSync(join(source, "manifest.json"))) {
  console.error("✖ 找不到 extension/manifest.json");
  process.exit(1);
}

// 语法闸门。没有构建步骤，所以没有编译器替我们发现语法错误 —— 而这里产出的
// zip 是直接拿去传商店的，一旦打出来就有人可能原样上传。所以生成产物之前
// 先让解析器真的读一遍源文件：service worker 解析失败不是「某个功能坏」，
// 是整个扩展一个动作都不会触发，且装上去不报任何错。
const JS_FILES = ["background.js", "content.js", "options.js", "sidepanel.js", "theme.js"];
const syntaxErrors = [];
for (const file of JS_FILES) {
  try {
    new vm.Script(readFileSync(join(source, file), "utf8"), { filename: file });
  } catch (e) {
    syntaxErrors.push(`${file}: ${e.message}`);
  }
}
if (syntaxErrors.length) {
  console.error("✖ 源文件存在语法错误，打出来的包装上去会静默失效：");
  for (const e of syntaxErrors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Packaging Hotkey Chain v${version} ...`);
rmSync(distRoot, { recursive: true, force: true });
mkdirSync(distRoot, { recursive: true });

// 压缩：用系统自带的工具，避免为了打包引入依赖
function createZip() {
  if (process.platform === "win32") {
    for (const exe of ["pwsh", "powershell"]) {
      try {
        const cmd = `Compress-Archive -Path '${join(source, "*")}' -DestinationPath '${zipPath}' -Force`;
        execFileSync(exe, ["-NoProfile", "-NonInteractive", "-Command", cmd], { stdio: "ignore" });
        return exe;
      } catch {
        /* 换下一个 */
      }
    }
    return null;
  }
  try {
    execFileSync("zip", ["-r", "-q", zipPath, ".", "-x", "*.DS_Store"], { cwd: source, stdio: "ignore" });
    return "zip";
  } catch {
    return null;
  }
}

// 读 zip 的中央目录，列出条目名。自己解析而不是调 unzip/PowerShell，
// 是为了让「产物验证」这一步在所有平台上行为一致 —— 而这一步存在的理由，
// 正是 Windows PowerShell 5.1 的 Compress-Archive 会写出反斜杠条目名，
// 商店会因此找不到根目录的 manifest。
function listZipEntries(file) {
  const buf = readFileSync(file);
  const EOCD = 0x06054b50;
  let eocd = -1;
  // EOCD 在文件末尾，注释最长 64KB，从后往前找
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error("不是有效的 zip：找不到中央目录结尾记录");

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const names = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("中央目录条目签名不对，压缩包可能已损坏");
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    names.push(buf.toString("utf8", p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return names;
}

const tool = createZip();
if (!tool) {
  console.error("✖ 找不到可用的压缩工具（pwsh / powershell / zip）");
  console.error("  extension/ 目录本身已经可以「加载已解压的扩展程序」，需要压缩包的话手动压 extension/ 的内容。");
  process.exit(1);
}

const entries = listZipEntries(zipPath);
const problems = [];
if (!entries.includes("manifest.json")) problems.push("manifest.json 不在压缩包根目录，商店会拒绝");
const backslashed = entries.filter((e) => e.includes("\\"));
if (backslashed.length) problems.push(`${backslashed.length} 个条目名用了反斜杠（如 ${backslashed[0]}），不符合 zip 规范`);

if (problems.length) {
  console.error(`✖ 压缩包有问题（用 ${tool} 生成）：`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`✔ 未压缩：  extension/                        （「加载已解压的扩展程序」直接选它）`);
console.log(`✔ 压缩包：  dist/hotkey-chain-v${version}.zip   （${entries.length} 个条目，可上传商店）`);
