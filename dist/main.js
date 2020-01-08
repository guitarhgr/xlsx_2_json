"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ============================= 导入
var fs_1 = __importDefault(require("fs"));
var jsonfile_1 = __importDefault(require("jsonfile"));
var path_1 = __importDefault(require("path"));
var types_1 = require("./types");
var xlsx_1 = __importDefault(require("xlsx"));
// ============================= 类型
// ============================= 常量
var Constants = /** @class */ (function () {
    function Constants() {
    }
    /**开始行 */
    Constants.START_ROW = 2;
    /**主键标识 */
    Constants.PRIMAY_FLAG = '!';
    return Constants;
}());
;
// ============================= 变量
/**构建配置 */
var buildCfg;
/**公式字符串 */
var formulaStr;
/**已导出公式列表 */
var formulaMap = new Map();
/**写公式文件定时器id*/
var writeFormulaTimer;
/**不导出列 */
var noExportColumn = new Map();
// ============================= 方法
/**
 * 入口
 */
var entry = function () {
    init();
    // 清空根目录
    readTargetFile(buildCfg.outputPath, deleteFile);
    // 处理文件
    readTargetFile(buildCfg.excelPath, handleFile);
};
/**
 * 初始化
 */
var init = function () {
    buildCfg = jsonfile_1.default.readFileSync('./buildcfg.json');
    formulaStr = buildCfg.formula.importStr;
};
/**
 * 读取目标路径文件
 * @param filePath 文件路径
 * @param fileCB 操作文件回调
 */
var readTargetFile = function (filePath, fileCB) {
    // 读取文件夹
    fs_1.default.readdir(filePath, function (err, files) {
        if (err) {
            console.warn(err);
            return;
        }
        files.forEach(function (fileName) {
            var fileDir = path_1.default.join(filePath, fileName);
            fs_1.default.stat(fileDir, function (err, stats) {
                if (err) {
                    console.warn(err);
                    return;
                }
                if (stats.isFile()) {
                    fileCB && fileCB(fileDir);
                }
                else if (stats.isDirectory()) {
                    readTargetFile(fileDir, fileCB);
                }
            });
        });
    });
};
/**
 * 删除文件
 * @param fileDir 文件全路径
 */
var deleteFile = function (fileDir) {
    fs_1.default.unlinkSync(fileDir);
};
/**
 * 处理文件
 * @param fileDir 文件全路径
 */
var handleFile = function (fileDir) {
    var splitArr = fileDir.split('\\');
    var fileName = splitArr[splitArr.length - 1];
    var fileSuffix = fileName.substr(fileName.lastIndexOf('.'));
    switch (fileSuffix) {
        case types_1.SupportType.XLS:
            handleExcel(fileName.replace(types_1.SupportType.XLS, ''), fileDir);
            break;
        case types_1.SupportType.XLSX:
            handleExcel(fileName.replace(types_1.SupportType.XLSX, ''), fileDir);
            break;
    }
};
/**
 * 获取映射键(空键不导出)
 * @param origin 原始数据
 */
var getMapkey = function (origin) {
    return origin.filter(function (item) { return !item.includes('__EMPTY'); });
};
/**
 * 获取字段类型
 * @param mapkey 映射键
 * @param keytype 键-类型
 */
var getFieldTypes = function (mapkey, keytype) {
    var fieldTypes = [];
    mapkey.forEach(function (key) {
        fieldTypes.push(keytype[key] || '');
    });
    return fieldTypes;
};
/**
 * 处理表数据
 * @param data 数据
 * @param mapkey 映射键
 */
var handleSheetData = function (dataArr, mapkey) {
    var result = [];
    dataArr.forEach(function (data) {
        var rawData = [];
        mapkey.forEach(function (key) {
            rawData.push(data[key] || 0);
        });
        result.push(rawData);
    });
    return result;
};
/**
 * 操作配置表
 * @param fileName 文件名称
 * @param filrDir 文件全路径
 */
var handleExcel = function (fileName, filrDir) {
    var workBook = xlsx_1.default.readFile(filrDir);
    var sheetNames = workBook.SheetNames;
    var sheets = workBook.Sheets;
    var handleData = {};
    for (var i = 0; i < sheetNames.length; i++) {
        var sheetName = sheetNames[i];
        var sheetData = xlsx_1.default.utils.sheet_to_json(sheets[sheetName]);
        if (sheetData.length < 3)
            continue;
        // 映射键
        var mapkey = getMapkey(Object.keys(sheetData[0]));
        // 字段类型
        var fieldTypes = getFieldTypes(mapkey, sheetData[0]);
        // 原始数据
        var originData = handleSheetData(sheetData.slice(Constants.START_ROW), mapkey);
        // 混合数据
        var blendData = blendSheetData(originData, fieldTypes, mapkey, fileName, sheetName);
        handleData[sheetName] = blendData;
    }
    writeDataToFile(buildCfg.outputPath + "/" + fileName + buildCfg.outputSuffix, handleData);
};
/**
 * 处理混合表数据
 * @param origin 原始数据
 * @param fieldTypes 字段类型
 * @param mapkey 映射键
 * @param excelName excel名称
 * @param sheetName 表格名称
 */
var blendSheetData = function (origin, fieldTypes, mapkey, excelName, sheetName) {
    var originObj = {};
    origin.forEach(function (raws) {
        var blendRaws = [];
        raws.forEach(function (val, index) {
            if (fieldTypes[index]) {
                blendRaws.push(convertToTypeVal(val, fieldTypes[index]));
            }
            else {
                var columnPath = "" + excelName + sheetName + (index + 1);
                if (!noExportColumn.get(columnPath)) {
                    console.warn("warn:: xlsx[" + excelName + "]_sheet[" + sheetName + "]_column[" + (index + 1) + "] doesn't cfg type, isn't export this column");
                    noExportColumn.set(columnPath, columnPath);
                }
            }
        });
        originObj[getPrimayKey(mapkey, blendRaws)] = blendRaws;
    });
    return {
        keys: convertMapkey(mapkey),
        vals: originObj
    };
};
/**
 * 转换映射key(去掉主键标识)
 */
var convertMapkey = function (mapkey) {
    var result = [];
    mapkey.forEach(function (key) {
        result.push(key.replace(Constants.PRIMAY_FLAG, ''));
    });
    return result;
};
/**
 * 是否是对象
 * @param val 判断值
 */
var isObject = function (val) {
    return typeof val === 'object';
};
/**
 * 获取主键索引(默认0号位作为key)
 * @param mapkey 映射键
 * @param val 值
 */
var getPrimayKey = function (mapkey, val) {
    if (!val.length)
        return '';
    var result = [];
    mapkey.forEach(function (key, index) {
        if (key.includes(Constants.PRIMAY_FLAG)) {
            result.push(isObject(val[index]) ? JSON.stringify(val[index]) : val[index]);
        }
    });
    result = result.length ? result : [isObject(val[0]) ? JSON.stringify(val[0]) : val[0]];
    return result.join('');
};
/**
 * 转换为类型值
 * @param val 值
 * @param type 字段类型
 */
var convertToTypeVal = function (val, type) {
    var result = val;
    var splitArr = type.replace(/\s*/g, "").split('|');
    type = splitArr[0];
    switch (type) {
        case 'string':
            result = result ? ("" + result).replace(/\"/g, '\'') : '';
            break;
        case 'number':
            result = result ? Number(result) : 0;
            break;
        case 'object':
            result = result ? (new Function('', "return " + result))() : '';
            break;
        case 'function':
            result = ("" + result).replace(/\"/g, '\'');
            result && generateFnField(result, splitArr[1]);
            break;
    }
    return result;
};
/**
 * 生成函数字段
 * @param fnStr 函数体
 * @param param 参数
 */
var generateFnField = function (fnStr, param) {
    if (formulaMap.get(fnStr))
        return;
    // TODO 这里根本不知道导入的Formula
    formulaMap.set(fnStr, fnStr);
    formulaStr = formulaStr + "\nFormula.set(\"" + fnStr + "\", function (" + (param || "") + ") { return " + fnStr + " });\n";
    writeFormulaTimer && clearTimeout(writeFormulaTimer);
    writeFormulaTimer = setTimeout(function () {
        writeDataToFile(buildCfg.formula.outputPath + "/" + buildCfg.formula.fileName, formulaStr, false);
    }, 500);
};
/**
 * 将数据写入文件
 * @param path 路径
 * @param data 数据
 * @param isStringify 是否需要序列化
 */
var writeDataToFile = function (path, data, isStringify) {
    if (isStringify === void 0) { isStringify = true; }
    var exportData = isStringify ? JSON.stringify(data) : data;
    // let exportData = isStringify ? JSON.stringify(data).replace(/\\/g, '').replace(/\"/g, '\'') : data;
    // let exportData = isStringify ? JSON.stringify(data) : data;
    fs_1.default.writeFile(path, exportData, 'utf-8', function (err) {
        if (err) {
            console.log(err);
            return;
        }
        exportData = null;
        console.log("log :: write [" + path + "] success");
    });
};
// ============================= 立即执行
entry();
//# sourceMappingURL=main.js.map