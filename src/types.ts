/**
 * 字段类型
 */
export type Field = 'number' | 'string' | 'object' | 'function';

/**
 * 构建配置
 */
export interface BuildCfg {
    /**
     * excel表路径
     */
    excelPath: string;
    /**
     * 导出路径
     */
    outputPath: string;
    /**
     * 导出后缀名
     */
    outputSuffix: string;
    /**
     * 公式配置
     */
    formula: {
        /**
         * 导出路径
         */
        outputPath: string,
        /**
         * 文件名
         */
        fileName: string,
        /**
         * 引用的字符串
         */
		importStr: string,
	}
}

/**
 * 表格配置
 */
export interface SheetCfg {
    /**
     * 
     * 表名
     */
    sheetName: string;
    /**
     * 数据开始行
     */
    startRow: number;
    /**
     * 导出文件
     */
    outputFile: string;
    /**
     * 模板路径
     */
    templatePath?: string;
    /**
     * 导出路径
     */
    outputPath?: string;
}

/**
 * 表数据
 */
export interface SheetObj {
    /**
     * 表名称
     */
    name: string;
    /**
     * 数据
     */
    data: any[];
}

/**
 * 支持类型
 */
export enum SupportType {
    /**
     * xlsx
     */
    XLSX = '.xlsx',
    XLS  = '.xls'
}