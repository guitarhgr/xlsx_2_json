// ============================= 导入
import fs from 'fs';
import jsonFile from 'jsonfile';
import path from 'path';
import { Field, BuildCfg, SupportType } from './types';
import xlsx from 'xlsx';
// ============================= 类型


// ============================= 常量
class Constants {
    /**开始行 */
    static START_ROW = 2;
    /**主键标识 */
    static PRIMAY_FLAG = '!';
};


// ============================= 变量
/**构建配置 */
let buildCfg: BuildCfg;
/**公式字符串 */
let formulaStr: string;
/**已导出公式列表 */
let formulaMap: Map<string, string> = new Map();
/**写公式文件定时器id*/
let writeFormulaTimer: NodeJS.Timeout;
/**不导出列 */
let noExportColumn: Map<string, string> = new Map();


// ============================= 方法
/**
 * 入口
 */
const entry = () => {
    init();
    // 清空根目录
    readTargetFile(buildCfg.outputPath, deleteFile);
    // 处理文件
    readTargetFile(buildCfg.excelPath, handleFile);
};

/**
 * 初始化
 */
const init = () => {
    buildCfg = jsonFile.readFileSync('./buildcfg.json');
    formulaStr = buildCfg.formula.importStr;
}

/**
 * 读取目标路径文件
 * @param filePath 文件路径
 * @param fileCB 操作文件回调
 */
const readTargetFile = (filePath: string, fileCB?: Function) => {

    // 读取文件夹
    fs.readdir(filePath, (err: NodeJS.ErrnoException | null, files: string[]) => {
        if (err) {
            console.warn(err);
            return;
        }

        files.forEach((fileName: string) => {
            const fileDir = path.join(filePath, fileName);

            fs.stat(fileDir, (err: NodeJS.ErrnoException | null, stats: fs.Stats) => {
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
const deleteFile = (fileDir: string) => {
    fs.unlinkSync(fileDir);
};

/**
 * 处理文件
 * @param fileDir 文件全路径
 */
const handleFile = (fileDir: string) => {
    const splitArr: string[] = fileDir.split('\\');
    const fileName: string = splitArr[splitArr.length-1];
    const fileSuffix: SupportType = (fileName.substr(fileName.lastIndexOf('.')) as SupportType);

    switch (fileSuffix) {
        case SupportType.XLS:
            handleExcel(fileName.replace(SupportType.XLS, ''), fileDir);
            break;
        case SupportType.XLSX:
            handleExcel(fileName.replace(SupportType.XLSX, ''), fileDir);
            break;
    }
};

/**
 * 获取映射键(空键不导出)
 * @param origin 原始数据
 */
const getMapkey = (origin: string[]) => {
    return origin.filter(item => !item.includes('__EMPTY'));
};

/**
 * 获取字段类型
 * @param mapkey 映射键
 * @param keytype 键-类型
 */
const getFieldTypes = (mapkey: string[], keytype: any): Field[] => {
    const fieldTypes: Field[] = [];

    mapkey.forEach((key: string) => {
        fieldTypes.push(keytype[key] || '');
    });

    return fieldTypes;
};

/**
 * 处理表数据
 * @param data 数据
 * @param mapkey 映射键
 */
const handleSheetData = (dataArr: any[], mapkey: string[]) => {
    const result: any[] = [];

    dataArr.forEach((data: any) => {
        const rawData: any[] = [];

        mapkey.forEach((key: string) => {
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
const handleExcel = (fileName: string, filrDir: string) => {
    const workBook: xlsx.WorkBook = xlsx.readFile(filrDir);
    const sheetNames: string[] = workBook.SheetNames;
    const sheets: xlsx.WorkSheet = workBook.Sheets;
    const handleData: any = {};

    for (let i = 0; i < sheetNames.length; i++) {
        const sheetName: string = sheetNames[i];
        const sheetData: Object[] = xlsx.utils.sheet_to_json(sheets[sheetName]);

        if (sheetData.length < 3) continue;

        // 映射键
        const mapkey: string[] = getMapkey(Object.keys(sheetData[0]));
        // 字段类型
        const fieldTypes: Field[] = getFieldTypes(mapkey, sheetData[0]);
        // 原始数据
        const originData: any[] = handleSheetData(sheetData.slice(Constants.START_ROW), mapkey);
        // 混合数据
        const blendData: any = blendSheetData(originData, fieldTypes, mapkey, fileName, sheetName);

        handleData[sheetName] = blendData;
    }

    writeDataToFile(`${buildCfg.outputPath}/${fileName}${buildCfg.outputSuffix}`, handleData)
};

/**
 * 处理混合表数据
 * @param origin 原始数据
 * @param fieldTypes 字段类型
 * @param mapkey 映射键
 * @param excelName excel名称
 * @param sheetName 表格名称
 */
const blendSheetData = (origin: any[], fieldTypes: Field[], mapkey: string[], excelName: string, sheetName: string) => {
    let originObj: any = {};
    
    origin.forEach((raws: any[]) => {
        let blendRaws: any = [];
        
        raws.forEach((val: any, index: number) => {
            if (fieldTypes[index]) {
                blendRaws.push(convertToTypeVal(val, fieldTypes[index]));
            }
            else {
                const columnPath = `${excelName}${sheetName}${index+1}`;

                if (!noExportColumn.get(columnPath)) {
                    console.warn(`warn:: xlsx[${excelName}]_sheet[${sheetName}]_column[${index+1}] doesn't cfg type, isn't export this column`);

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
const convertMapkey = (mapkey: string[]): string[] => {
    let result: string[] = [];

    mapkey.forEach((key: string) => {
        result.push(key.replace(Constants.PRIMAY_FLAG, ''));
    });

    return result;
};

/**
 * 是否是对象
 * @param val 判断值
 */
const isObject = (val: any): boolean => {
    return typeof val === 'object';
}

/**
 * 获取主键索引(默认0号位作为key)
 * @param mapkey 映射键
 * @param val 值
 */
const getPrimayKey = (mapkey: string[], val: any[]): string => {
    if (!val.length) return '';

    let result: any[] = [];

    mapkey.forEach((key: string, index: number) => {
        if (key.includes(Constants.PRIMAY_FLAG)) {
            result.push(isObject(val[index]) ? JSON.stringify(val[index]) : val[index]);
        }
    });

    result = result.length ? result : [isObject(val[0]) ? JSON.stringify(val[0]) : val[0]];

    return result.join('');
}

/**
 * 转换为类型值
 * @param val 值
 * @param type 字段类型
 */
const convertToTypeVal = (val: any, type: Field): any => {
    let result = val;
    let splitArr = type.replace(/\s*/g,"").split('|');

    type = (splitArr[0] as Field);

    switch (type) {
        case 'string':
            result = result ? `${result}`.replace(/\"/g, '\'') : '';
            break;
        case 'number':
            result = result ? Number(result) : 0;
            break;
        case 'object':
            result = result ? (new Function('', `return ${result}`))(): '';
            break;
        case 'function':
            result = `${result}`.replace(/\"/g, '\'');
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
const generateFnField = (fnStr: string, param: string) => {
    if (formulaMap.get(fnStr)) return;

    // TODO 这里根本不知道导入的Formula
    formulaMap.set(fnStr, fnStr);
    formulaStr = `${formulaStr}
Formula.set("${fnStr}", function (${param||""}) { return ${fnStr} });
`;

    writeFormulaTimer && clearTimeout(writeFormulaTimer);

    writeFormulaTimer = setTimeout(() => {
        writeDataToFile(`${buildCfg.formula.outputPath}/${buildCfg.formula.fileName}`, formulaStr, false);
    }, 500);
};

/**
 * 将数据写入文件
 * @param path 路径
 * @param data 数据
 * @param isStringify 是否需要序列化
 */
const writeDataToFile = (path: string, data: any, isStringify = true) => {
    let exportData = isStringify ? JSON.stringify(data) : data;
    // let exportData = isStringify ? JSON.stringify(data).replace(/\\/g, '').replace(/\"/g, '\'') : data;
    // let exportData = isStringify ? JSON.stringify(data) : data;

    fs.writeFile(path, exportData, 'utf-8', (err: NodeJS.ErrnoException | null) => {
        if (err) {
            console.log(err);
            return;
        }

        exportData = null;
        
        console.log(`log :: write [${path}] success`);
    });
};

// ============================= 立即执行
entry();