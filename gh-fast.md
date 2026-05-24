| **变量名**  | **推荐值** | **说明**|   
| ASSET_URL | https://xxxx.pages.dev |静态资源|
| PREFIX | / | 路径前缀 如果自定义路由为example.com/gh/*，将PREFIX改为 '/gh/'，注意，少一个杠都会错！|
| ENABLE_JSDELIVR | 0 | 0 = GitHub实时更新  1=jsDelivr 有缓存|
| FORCE_HK_NODE | 1 | 1=开启强制地区 0=关闭|
| CF_REGION | HK | HK 香港 / JP 日本 / SG 新加坡 /韩国 = KR /台湾 = TW|
| WHITE_LIST | /username/,/repo/ |白名单，逗号分隔|