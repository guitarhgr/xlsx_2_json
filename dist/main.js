"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ============================= 导入
var fs_1 = __importDefault(require("fs"));
var node_xlsx_1 = __importDefault(require("node-xlsx"));
var jsonfile_1 = __importDefault(require("jsonfile"));
// ============================= 变量
var OUTPUT_ROOT = 'E:\\Learn\\coder\\CocosProj\\FoodEscape\\assets\\resources\\config\\';
var cfgOutputObj = jsonfile_1.default.readFileSync('./cfg_output.json');
// ============================= 方法
/**
 * 查找表索引
 * @param excelData excel数据
 * @param sheetName 表名
 */
var findSheetIndex = function (excelData, sheetName) {
    for (var i = 0; i < excelData.length; i++) {
        var sheetData = excelData[i];
        if (sheetData.name === sheetName)
            return i;
    }
    return -1;
};
/**
 * 操作导出配置表
 */
var handleCfgOutput = function () {
    for (var excelName in cfgOutputObj) {
        var cfgArr = cfgOutputObj[excelName];
        var _loop_1 = function (i) {
            var cfgOne = cfgArr[i];
            var excelData = node_xlsx_1.default.parse("./excel/" + excelName);
            var sheetIdx = findSheetIndex(excelData, cfgOne.sheetName);
            if (sheetIdx < 0)
                return "continue";
            var sheetData = excelData[sheetIdx];
            var sheetHeader = sheetData.data[cfgOne.startRow - 2];
            var keyJson = jsonfile_1.default.readFileSync(cfgOne.keyPath);
            var headerMapKey = [];
            sheetHeader.forEach(function (item) {
                for (var key in keyJson) {
                    if (keyJson[key] === item) {
                        headerMapKey.push(key);
                        break;
                    }
                }
            });
            var originData = sheetData.data.slice(cfgOne.startRow - 1);
            var sheetMixData = [];
            originData.forEach(function (rawData) {
                var mixObj = {};
                rawData.forEach(function (val, index) {
                    var _a;
                    Object.assign(mixObj, (_a = {}, _a[headerMapKey[index]] = JSON.parse(val), _a));
                });
                sheetMixData.push(mixObj);
            });
            generateCfg(cfgOne, sheetMixData);
        };
        for (var i = 0; i < cfgArr.length; i++) {
            _loop_1(i);
        }
    }
};
/**
 * 生成配置数据
 * @param cfgOutput
 * @param data
 */
var generateCfg = function (cfgOutput, sheetMixData) {
    var path = cfgOutput.outputRoot || "" + OUTPUT_ROOT + cfgOutput.outputFile;
    if (!cfgOutput.templatePath) {
        writeDataToFile(path, sheetMixData);
        return;
    }
    fs_1.default.readFile(cfgOutput.templatePath, 'utf-8', function (err, fnStr) {
        if (err) {
            console.log(err);
            return;
        }
        console.log("read template " + cfgOutput.templatePath + " success");
        var templateFn = new Function('mixData', fnStr);
        var exportData = templateFn(sheetMixData);
        writeDataToFile(path, exportData);
        exportData = null;
        cfgOutput = null;
        templateFn = null;
        sheetMixData = null;
    });
};
/**
 * 将数据写入文件
 * @param path
 * @param exportData
 */
var writeDataToFile = function (path, exportData) {
    fs_1.default.writeFile(path, JSON.stringify(exportData), 'utf-8', function (err) {
        if (err) {
            console.log(err);
            return;
        }
        exportData = null;
        console.log('success');
    });
};
// ============================= 立即执行
handleCfgOutput();
//# sourceMappingURL=main.js.map