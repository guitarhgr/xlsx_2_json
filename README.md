# nodejs的excel简单导出自定义json文件


## 文件目录结构
```
|-- .gitignore,                 // 忽略项
|-- buildcfg.json,              // 构建配置
|-- package-lock.json,          // 包锁定
|-- package.json,               // 包配置
|-- README.md,                  // 说明文档
|-- start.bat,                  // 开始执行文件
|-- tsconfig.json,              // ts配置
|-- yarn.lock,                  // yarn包锁定
|-- .vscode,                    // vscode调试文件
|   |-- launch.json,
|-- dist,                       // ts构建文件
|   |-- main.js,
|   |-- main.js.map,
|   |-- types.js,
|   |-- types.js.map,
|-- excel,                      // excel表
|   |-- build.xlsx,
|   |-- prop.xlsx,
|-- src,                        // 源码文件
    |-- main.ts,
    |-- types.ts
```


## 准备工作

1. 克隆项目
2. 安装node
3. 安装yarn
4. 在项目执行安装node模块

## 导出步骤

### 1.配置构建配置文件

```json
{
	"excelPath": "./excel", // excel表路径
	"outputPath": "../Card/laya/assets/cfg", // 导出文件路径
	"outputSuffix": ".json", // 导出文件后最名
    // 公式导出配置
	"formula": {
		"outputPath": "../Card/src/app/mod", // 导出路径
		"fileName": "formulaCfg.ts", // 导出文件名
		"importStr": "import { Formula } from './formula';" // 公式引用(根据自己的项目决定)
	}
}
```



### 2.放表

​	把xlsx/xls表放在配置的excelPath路径下



### 3. 配置表结构

表结构:

| !level | cost     | des      | func              |
| ------ | -------- | -------- | ----------------- |
| number | number   | number   | function \| a,b,c |
| 等级   | 消耗钻石 | 产出描述 | a+b+c             |
| 1      | 10       | 产出10   | a+b+c             |
| 2      | 20       | 产出20   | a+b+c             |

- 键：第一行。使用“!”来作为主键标识符，不配置默认第一列第一行作为主键，不配置键名不导出

- 值类型：第二行。string，number，object，function。

  - string: 字符串

  - number:  数字
  - object: 对象(配置的对象必须满足对象格式)
  - function: function的参数为“|”后的字符，用“,”分隔参数；导出公式统一放在buildcfg.json配置的导出公式路径文件里

- 键值中文名：第三行

- 值：从第四行开始



### 4.执行导出

执行根目录下面的start.bat程序。



### 5.导出结构

每张excel导出为一个json，里面的sheet作为这个json的每一项，例如build.xlsx导出为build.json:

```json
{
    // sheet名称
    "build.json": {
        // 键
        "keys": ["level", "diamond", "gold"],
        // 值
        "vals": {"1": ["1", 10, "f.a + f.b"], ......}
    }
}
```

导出的公式formula.ts

```typescript
import { Formula } from "./formula";
Formula.set("f.a + f.b", function (f) { return f.a + f.b });
.....
```



## 注意



## TODO

- 显示报错log没做