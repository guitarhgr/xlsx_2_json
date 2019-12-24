/**
 * 字段类型
 */
export type Filed = 'number' | 'string' | 'object' | 'function';

/**
 * 构建配置
 */
export interface BuildCfg {
    /**
     * excel表路径
     */
    excelPath: string;
    /**
     * 到处路径
     */
    outputPath: string;
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
    templatePath: string;
    /**
     * 键路径
     */
    keyPath?: string;
    /**
     * 导出路径
     */
    outputPath?: string;
    
}

/**
 * 表数据
 */
export interface SheetData {
    /**
     * 表名称
     */
    name: string;
    /**
     * 数据
     */
    data: any[];
}