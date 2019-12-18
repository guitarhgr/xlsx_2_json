# nodejs的excel简单导出自定义json文件



## 文件目录结构
```
|-- cfg_output.json                                    // 导出配置
|-- package.json                                       // 包json配置
|-- README.md
|-- start.bat                                          // 执行导出的批处理程序
|-- tsconfig.json                                      // ts配置
|-- yarn.lock                                          // 包锁定配置
|-- .vscode                                            // vscode执行调试文件
|   |-- launch.json
|-- dist                                               // 构建生成目录
|   |-- main.js
|   |-- main.js.map
|-- excel                                              // excel表
|   |-- build.xlsx
|   |-- prop.xlsx
|-- keys                                               // 表头对应key
|   |-- build.json
|   |-- prop.json
|-- src                                                // 源码
|   |-- main.ts
|-- templates                                          // 导出模板
        |-- build.template
        |-- prop.template
```


## 准备工作

1. 克隆项目
2. 安装node
3. 安装yarn
4. 在项目执行安装node模块

## 导出步骤

### 1.配置导出路径OUTPUT_ROOT

​    找到src下面的main.ts修改代码OUTPUT_ROOT为你需要导出文件路径

### 2.放表

​	把xlsx表放在项目根目录下的excel下

### 3.配置导出cfg_output.json

在cfg_output.json中新增导出配置，如下：

```json
{
    // xlsx文件名
    "build.xlsx": [
        {
            "sheetName": "build", // 表名
            "startRow": 3, // 用到的数据开始行
            "keyPath": "./keys/build.json", // [列项-键]映射json
            "templatePath": "./templates/build.template", // 模板
            "outputRoot": "", // 导出路径 不写为默认OUTPUT_ROOT路径
            "outputFile": "build.cfg" // 生成文件名
        }
    ]
}
```



### 4. 配置[列项-键]映射json

表:

|      |          |          |
| ---- | -------- | -------- |
| 等级 | 消耗钻石 | 产出金币 |
| 1    | 10       |          |
| 2    | 20       |          |

json(key[自定义的], val[对应表第二行文字]):

```json
{
    "level": "等级",
    "diamond": "消耗钻石",
    "gold": "产出金币"
}
```



### 5.配置模板(默认导出json格式)

该模板是js的函数体,例如：

```javascript
let resultObj = {};

for (let i = 0; i < mixData.length; i++) {
    const data = mixData[i];

    if (!data) return;

    resultObj[data.level] = [data.level, data.diamond, data.gold]
}

return resultObj;
```

接收的数据是混合后的表数据数组[mixData]，例如：

```
[
	{ level: 1, diamond: 10, gold: 20 },
	{ level: 2, diamond: 20, gold: 40 }
]
```



### 6.执行导出

执行根目录下面的start.bat程序。



## 注意

- 表中的字符串数据项必须用“”引起来



## TODO

- 测试导出公式
- 配置导出基本项：导出路径，...
- 显示报错log没做
- 模板用其它方式实现，不用new Function的来实现
- 指定表每项的类型(string | number |....)
- 测试复杂数据导出