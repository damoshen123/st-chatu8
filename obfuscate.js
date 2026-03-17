const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// 需要混淆的文件夹和文件
const foldersToObfuscate = ['utils'];
const filesToObfuscate = ['index.js'];

// 输出目录
const outputDir = 'dist';

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 混淆选项
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
    // 禁用 sourceMap
    sourceMap: false,
};

// 递归地获取一个目录下的所有 JS 文件
function getJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getJsFiles(file));
        } else if (path.extname(file) === '.js') {
            results.push(file);
        }
    });
    return results;
}

// 处理所有需要混淆的文件
const allFiles = [...filesToObfuscate];
foldersToObfuscate.forEach(folder => {
    allFiles.push(...getJsFiles(folder));
});

allFiles.forEach(filePath => {
    const code = fs.readFileSync(filePath, 'utf8');
    const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        ...obfuscationOptions,
        sourceMapFileName: `${path.basename(filePath)}.map`,
        inputFileName: path.basename(filePath)
    });

    const outputFilePath = path.join(outputDir, filePath);
    const outputDirPath = path.dirname(outputFilePath);

    // 确保输出文件的目录存在
    if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
    }

    fs.writeFileSync(outputFilePath, obfuscationResult.getObfuscatedCode());
    console.log(`混淆完成: ${filePath} -> ${outputFilePath}`);
});

console.log('所有文件混淆完成！');
