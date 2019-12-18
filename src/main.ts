// ============================= 导入
import fs from 'fs';
import xlsx from 'node-xlsx';
import jsonFile from 'jsonfile';

// ============================= 类型
type TCfgOutput = {
    sheetName: string,
    startRow: number,
    keyPath: string,
    templatePath: string,
    outputRoot: string,
    outputFile: string
}

type TSheetData = {
    name: string,
    data: any[]
}

// ============================= 变量
const OUTPUT_ROOT = 'E:\\Learn\\coder\\CocosProj\\FoodEscape\\assets\\resources\\cfg\\';
const cfgOutputObj = jsonFile.readFileSync('./cfg_output.json');

// ============================= 方法
/**
 * 查找表索引
 * @param excelData excel数据
 * @param sheetName 表名
 */
const findSheetIndex = (excelData: TSheetData[], sheetName:string): number => {
    for (let i = 0; i < excelData.length; i++) {
        const sheetData = excelData[i];

        if (sheetData.name === sheetName) return i;
    }

    return -1;
};

/**
 * 操作导出配置表
 */
const handleCfgOutput = () => {
    for (let excelName in cfgOutputObj) {
        const cfgArr: TCfgOutput[] = cfgOutputObj[excelName];

        for (let i = 0; i < cfgArr.length; i++) {
            const cfgOne: TCfgOutput = cfgArr[i];
            const excelData: TSheetData[] = xlsx.parse(`./excel/${excelName}`);
            const sheetIdx:number = findSheetIndex(excelData, cfgOne.sheetName);
    
            if (sheetIdx < 0) continue;
    
            const sheetData: TSheetData = excelData[sheetIdx];
            const sheetHeader: string[] = sheetData.data[cfgOne.startRow-2];
            const keyJson: any = jsonFile.readFileSync(cfgOne.keyPath);
            const headerMapKey: string[] = [];
    
            sheetHeader.forEach((item: string) => {
                for (let key in keyJson) {
                    if (keyJson[key] === item) {
                        headerMapKey.push(key);
                        break;
                    }
                }
            });

            const originData:any[] = sheetData.data.slice(cfgOne.startRow-1);
            const sheetMixData:any[] = [];

            originData.forEach((rawData: any[]) => {
                let mixObj: Object = {};

                rawData.forEach((val: any, index: number) => {
                    Object.assign(
                        mixObj,
                        { [headerMapKey[index]] : JSON.parse(val) }
                    );
                });

                sheetMixData.push(mixObj);
            });

            generateCfg(cfgOne, sheetMixData);
        }
    }
}

/**
 * 生成配置数据
 * @param cfgOutput 
 * @param data 
 */
const generateCfg = (cfgOutput: TCfgOutput, sheetMixData: any[]) => {
    const path = cfgOutput.outputRoot || `${OUTPUT_ROOT}${cfgOutput.outputFile}`;

    if (!cfgOutput.templatePath) {
        writeDataToFile(path, sheetMixData);
        return;
    }

    fs.readFile(cfgOutput.templatePath, 'utf-8', (err: NodeJS.ErrnoException | null, fnStr: string) => {
        if (err) {
            console.log(err);
            return;
        }

        console.log(`read template ${cfgOutput.templatePath} success`);

        let templateFn: Function = new Function('mixData', fnStr);
        let exportData: any = templateFn(sheetMixData);

        writeDataToFile(path, exportData);

        exportData = null;
        (cfgOutput as any) = null;
        (templateFn as any) = null;
        (sheetMixData as any ) = null;

    });
};

/**
 * 将数据写入文件
 * @param path 
 * @param exportData 
 */
const writeDataToFile = (path: string, exportData: any) => {

    fs.writeFile(path, JSON.stringify(exportData), 'utf-8', (err: NodeJS.ErrnoException | null) => {
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