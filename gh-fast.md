| **变量名**        | **推荐值**                | **说明**                                              |
|--------------------|---------------------------|------------------------------------------------------|
| ASSET_URL          | https://xxxx.pages.dev    | 静态资源地址                                           |
| PREFIX             | /、/gh/                   | 路由路径前缀，常规使用填 / 注意，少一个杠都会错！         |
| ENABLE_JSDELIVR    | 0、1                      | 0=GitHub 实时资源，1 = 启用jsDelivr镜像（有缓存）       |
| FORCE_REGION       | 0、1                      | 0 = 自动分配节点，1 = 强制指定地区节点                  |
| CF_REGION_CODE     | HK/JP/SG/KR/TW            | 地区代码：香港 / 日本 / 新加坡 / 韩国 / 台湾            |
| WHITE_LIST         | 空、/user/,/repo/         | 访问白名单，逗号分隔，留空无限制                        |

---

### 图片
<img src="gh-fast.png" width="750">

https://cdn.jsdelivr.net/gh/yf20230412/gh-proxy/refs/heads/master/gh-fast.png


### ENABLE_JSDELIVR变量为 1 时
```
https://raw.githubusercontent.com/yf20230412/gh-proxy/refs/heads/master/gh-fast.png
```

拼接格式：
```
https://cdn.jsdelivr.net/gh/用户名/仓库名@分支标签/文件路径
```

- 用户名： yf20230412 
​
- 仓库名： gh-proxy 
​
- 分支版本： refs/heads/master 
​
- 剩余文件路径： gh-fast.png

最终拼接完成链接：
```
https://cdn.jsdelivr.net/gh/yf20230412/gh-proxy@refs/heads/master/gh-fast.png
```

