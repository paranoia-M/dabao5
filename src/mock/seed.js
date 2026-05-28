/**
 * 自动生成的种子数据 — 应用首次启动时（localStorage 为空）注入到对应 store。
 * 修改本文件后，需先清除 localStorage 才能生效。
 */
const SEED = {
  "sheji-user" : [ {
    "id" : "user_1000",
    "username" : "admin_zhang",
    "realName" : "张明强",
    "email" : "zhangmingqiang@dataplatform.com",
    "phone" : "13800001111",
    "role" : "系统管理员",
    "status" : "启用"
  }, {
    "id" : "user_1001",
    "username" : "liwei_data",
    "realName" : "李伟",
    "email" : "liwei@dataplatform.com",
    "phone" : "13900002222",
    "role" : "数据管理员",
    "status" : "启用"
  }, {
    "id" : "user_1002",
    "username" : "wangfang",
    "realName" : "王芳",
    "email" : "wangfang@dataplatform.com",
    "phone" : "13700003333",
    "role" : "普通员工",
    "status" : "启用"
  }, {
    "id" : "user_1003",
    "username" : "zhaolei_analyst",
    "realName" : "赵磊",
    "email" : "zhaolei@dataplatform.com",
    "phone" : "13600004444",
    "role" : "数据分析师",
    "status" : "启用"
  }, {
    "id" : "user_1004",
    "username" : "chenyi_report",
    "realName" : "陈怡",
    "email" : "chenyi@dataplatform.com",
    "phone" : "13500005555",
    "role" : "报表查看员",
    "status" : "禁用"
  }, {
    "id" : "user_1005",
    "username" : "sunpeng_audit",
    "realName" : "孙鹏",
    "email" : "sunpeng@dataplatform.com",
    "phone" : "13400006666",
    "role" : "系统审计员",
    "status" : "启用"
  }, {
    "id" : "user_1006",
    "username" : "zhoujing_pm",
    "realName" : "周静",
    "email" : "zhoujing@dataplatform.com",
    "phone" : "13300007777",
    "role" : "项目经理",
    "status" : "启用"
  }, {
    "id" : "user_1007",
    "username" : "longtao_ops",
    "realName" : "龙涛",
    "email" : "longtao@dataplatform.com",
    "phone" : "13200008888",
    "role" : "运维工程师",
    "status" : "禁用"
  } ],
  "sheji-dataAsset" : [ {
    "id" : "dataasset_1000",
    "name" : "客户主数据表",
    "code" : "CUST_MASTER",
    "domain" : "客户域",
    "sourceType" : "数据库表",
    "ownerId" : "user_1005",
    "status" : "已发布",
    "description" : "企业客户核心信息表，包含客户编码、名称、信用等级、联系方式，数据来源CRM系统每日同步更新。"
  }, {
    "id" : "dataasset_1001",
    "name" : "月度销售业绩报表",
    "code" : "SALES_MONTHLY",
    "domain" : "销售域",
    "sourceType" : "文件",
    "ownerId" : "user_1005",
    "status" : "待审核",
    "description" : "每月财务生成的销售业绩Excel文件，含各区销售额、回款率及同比环比分析，用于管理层决策。"
  }, {
    "id" : "dataasset_1002",
    "name" : "供应商准入审核接口",
    "code" : "SUPPLIER_AUDIT_API",
    "domain" : "采购域",
    "sourceType" : "API接口",
    "ownerId" : "user_1005",
    "status" : "待审核",
    "description" : "向采购系统提供供应商工商资质核验、历史合作记录查询的RESTful接口，响应时间<200ms。"
  }, {
    "id" : "dataasset_1003",
    "name" : "员工劳动合同台账",
    "code" : "EMP_CONTRACT",
    "domain" : "人力资源域",
    "sourceType" : "数据库表",
    "ownerId" : "user_1000",
    "status" : "草稿",
    "description" : "存储全体员工劳动合同签订日期、到期日、续签记录，数据源于EHR系统，用于合同到期预警。"
  }, {
    "id" : "dataasset_1004",
    "name" : "信贷风险评分模型输出",
    "code" : "CREDIT_RISK_SCORE",
    "domain" : "风控域",
    "sourceType" : "API接口",
    "ownerId" : "user_1002",
    "status" : "已发布",
    "description" : "实时计算个人信贷申请的风险评分，调用量日均10万次，返回0-100分及违约概率预测。"
  }, {
    "id" : "dataasset_1005",
    "name" : "仓储库存快照文件",
    "code" : "INV_SNAPSHOT",
    "domain" : "运营域",
    "sourceType" : "文件",
    "ownerId" : "user_1003",
    "status" : "已下架",
    "description" : "每日凌晨生成的仓库库存快照CSV，包含SKU、库位、可用量，替换为实时接口后已下架。"
  }, {
    "id" : "dataasset_1006",
    "name" : "订单交易流水表",
    "code" : "ORDER_TRANS",
    "domain" : "销售域",
    "sourceType" : "数据库表",
    "ownerId" : "user_1007",
    "status" : "草稿",
    "description" : "记录每一笔订单的交易明细，包括商品ID、数量、金额、支付时间，分表存储按日归档。"
  }, {
    "id" : "dataasset_1007",
    "name" : "项目周报收集接口",
    "code" : "PROJ_WEEKLY_API",
    "domain" : "研发域",
    "sourceType" : "API接口",
    "ownerId" : "user_1005",
    "status" : "待审核",
    "description" : "项目管理平台定时调用，获取各项目组进度周报的JSON格式汇总数据，用于领导看板展示。"
  }, {
    "id" : "dataasset_1008",
    "name" : "物流运单状态表",
    "code" : "LOGISTICS_TRACK",
    "domain" : "物流域",
    "sourceType" : "数据库表",
    "ownerId" : "user_1005",
    "status" : "已发布",
    "description" : "实时同步承运商回传的运单节点信息，包含揽收、中转、派送、签收状态，更新频率5分钟。"
  }, {
    "id" : "dataasset_1009",
    "name" : "渠道合作伙伴评估报告",
    "code" : "CHANNEL_EVAL",
    "domain" : "渠道域",
    "sourceType" : "文件",
    "ownerId" : "user_1004",
    "status" : "草稿",
    "description" : "按季度生成的渠道伙伴绩效评估PDF报告，涵盖销售额达成率、客诉率、市场覆盖指标，尚未审批。"
  }, {
    "id" : "dataasset_1010",
    "name" : "财务总账科目余额表",
    "code" : "GL_BALANCE",
    "domain" : "财务域",
    "sourceType" : "数据库表",
    "ownerId" : "user_1002",
    "status" : "待审核",
    "description" : "企业总账各科目月度余额汇总，来源财务系统，用于预算分析及会计对账。"
  }, {
    "id" : "dataasset_1011",
    "name" : "舆情监控热点数据接口",
    "code" : "PUBLIC_SENTIMENT",
    "domain" : "运营域",
    "sourceType" : "API接口",
    "ownerId" : "user_1007",
    "status" : "待审核",
    "description" : "爬虫系统采集主流社交平台关键词热度，对外提供实时舆情趋势JSON API，尚未上线。"
  }, {
    "id" : "dataasset_1012",
    "name" : "设备运维工单记录表",
    "code" : "MAINTENANCE_ORDER",
    "domain" : "运营域",
    "sourceType" : "数据库表",
    "ownerId" : "user_1000",
    "status" : "已下架",
    "description" : "记录生产车间设备报修与保养工单，包含故障现象、维修人员、耗时，因系统升级已停止更新。"
  }, {
    "id" : "dataasset_1013",
    "name" : "年度培训计划文件",
    "code" : "TRAINING_PLAN",
    "domain" : "人力资源域",
    "sourceType" : "文件",
    "ownerId" : "user_1002",
    "status" : "草稿",
    "description" : "HR部门编制的年度员工培训计划Excel表，含课程名称、参训人员、预算，待部门审核。"
  }, {
    "id" : "dataasset_1014",
    "name" : "用户行为埋点上报接口",
    "code" : "USER_TRACKING_API",
    "domain" : "数据域",
    "sourceType" : "API接口",
    "ownerId" : "user_1006",
    "status" : "草稿",
    "description" : "前端SDK采集的用户点击、页面停留、转化事件，通过HTTP接口上报至数仓，日处理5亿条。"
  }, {
    "id" : "dataasset_1015",
    "name" : "生产日报表（车间级）",
    "code" : "PROD_DAILY",
    "domain" : "生产域",
    "sourceType" : "文件",
    "ownerId" : "user_1005",
    "status" : "已发布",
    "description" : "各生产车间每日产量、合格率、设备利用率汇总Excel，车间主任填报后提交至调度中心。"
  }, {
    "id" : "dataasset_1016",
    "name" : "审批流程配置表",
    "code" : "WORKFLOW_CONFIG",
    "domain" : "IT域",
    "sourceType" : "数据库表",
    "ownerId" : "user_1000",
    "status" : "待审核",
    "description" : "存储各类业务审批流程图和节点配置，用于低代码平台动态渲染，即将发布最新版本。"
  }, {
    "id" : "dataasset_1017",
    "name" : "招投标结果公告接口",
    "code" : "BID_RESULT_API",
    "domain" : "采购域",
    "sourceType" : "API接口",
    "ownerId" : "user_1005",
    "status" : "已下架",
    "description" : "对外公开招标结果查询接口，因政策变动停用，数据转为内部文件存档。"
  }, {
    "id" : "dataasset_1018",
    "name" : "财务总账报表",
    "code" : "FSS-2026",
    "domain" : "财务管理",
    "sourceType" : "数据库表",
    "ownerId" : "user_1007",
    "status" : "已发布",
    "description" : "包含公司资产负债表和利润表的月度数据，每日凌晨从ERP系统同步至数据仓库，用于财务分析和合规披露。"
  }, {
    "id" : "dataasset_1019",
    "name" : "客户投诉记录",
    "code" : "CCM-2026",
    "domain" : "客户服务",
    "sourceType" : "文件",
    "ownerId" : "user_1000",
    "status" : "待审核",
    "description" : "从客服系统导出的CSV格式投诉明细，包含客户编号、投诉日期和问题分类，需定期清洗加载至数据集市。"
  }, {
    "id" : "dataasset_1020",
    "name" : "库存实时快照",
    "code" : "WMS-API-2026",
    "domain" : "仓储物流",
    "sourceType" : "API接口",
    "ownerId" : "user_1005",
    "status" : "已下架",
    "description" : "通过WMS系统的REST接口获取的库存余量实时数据，因接口升级暂时下架，待重新对接后恢复上线。"
  }, {
    "id" : "dataasset_1021",
    "name" : "员工考勤汇总",
    "code" : "HR-MS2026",
    "domain" : "人力资源",
    "sourceType" : "数据库表",
    "ownerId" : "user_1000",
    "status" : "草稿",
    "description" : "汇总每日打卡记录生成的月度考勤汇总表，目前正在校验数据准确性，尚未提交审核流程。"
  }, {
    "id" : "dataasset_1022",
    "name" : "产品质检报告",
    "code" : "QCR-2026-05",
    "domain" : "质量管理",
    "sourceType" : "文件",
    "ownerId" : "user_1006",
    "status" : "已发布",
    "description" : "生产车间每周质检数据以PDF报告形式归档，包含批次合格率和关键缺陷分布图表，支持按月追溯。"
  }, {
    "id" : "dataasset_1023",
    "name" : "销售订单流水",
    "code" : "API-SO-2026",
    "domain" : "销售管理",
    "sourceType" : "API接口",
    "ownerId" : "user_1005",
    "status" : "待审核",
    "description" : "从销售系统API实时推送的订单创建事件流，用于构建订单漏斗分析模型，数据量约每天5万条。"
  } ],
  "sheji-dataAssetField" : [ {
    "id" : "dataassetfield_1000",
    "assetId" : "dataasset_1014",
    "fieldName" : "客户ID",
    "fieldType" : "string",
    "description" : "客户唯一标识，由系统自动生成UUID，不可为空，用于全局唯一识别每个客户。",
    "sensitivityLevel" : "机密",
    "isPrimaryKey" : true,
    "maxLength" : 36
  }, {
    "id" : "dataassetfield_1001",
    "assetId" : "dataasset_1020",
    "fieldName" : "客户名称",
    "fieldType" : "string",
    "description" : "客户全称，最长支持100个汉字，用于展示和搜索，不可为空。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : false,
    "maxLength" : 100
  }, {
    "id" : "dataassetfield_1002",
    "assetId" : "dataasset_1015",
    "fieldName" : "性别",
    "fieldType" : "string",
    "description" : "客户性别，可选值男/女/未知，默认未知，用于基础信息统计。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : false,
    "maxLength" : 4
  }, {
    "id" : "dataassetfield_1003",
    "assetId" : "dataasset_1016",
    "fieldName" : "出生日期",
    "fieldType" : "date",
    "description" : "客户出生日期，格式YYYY-MM-DD，用于年龄计算和营销分析。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : false,
    "maxLength" : 10
  }, {
    "id" : "dataassetfield_1004",
    "assetId" : "dataasset_1000",
    "fieldName" : "手机号码",
    "fieldType" : "string",
    "description" : "客户手机号，用于登录和通知，需校验11位数字，不可为空。",
    "sensitivityLevel" : "敏感",
    "isPrimaryKey" : true,
    "maxLength" : 11
  }, {
    "id" : "dataassetfield_1005",
    "assetId" : "dataasset_1011",
    "fieldName" : "电子邮箱",
    "fieldType" : "string",
    "description" : "客户邮箱地址，用于接收账单和营销邮件，最长50字符，可为空。",
    "sensitivityLevel" : "敏感",
    "isPrimaryKey" : true,
    "maxLength" : 50
  }, {
    "id" : "dataassetfield_1006",
    "assetId" : "dataasset_1003",
    "fieldName" : "注册时间",
    "fieldType" : "datetime",
    "description" : "客户注册时间，精确到秒，记录用户首次注册平台的时刻。",
    "sensitivityLevel" : "机密",
    "isPrimaryKey" : false,
    "maxLength" : 19
  }, {
    "id" : "dataassetfield_1007",
    "assetId" : "dataasset_1009",
    "fieldName" : "最后登录时间",
    "fieldType" : "datetime",
    "description" : "客户最近一次登录平台的时间，用于判断活跃度和流失预警。",
    "sensitivityLevel" : "机密",
    "isPrimaryKey" : false,
    "maxLength" : 19
  }, {
    "id" : "dataassetfield_1008",
    "assetId" : "dataasset_1007",
    "fieldName" : "账户状态",
    "fieldType" : "string",
    "description" : "账户当前状态，可选正常/冻结/注销，用于权限控制和业务阻断。",
    "sensitivityLevel" : "内部",
    "isPrimaryKey" : false,
    "maxLength" : 10
  }, {
    "id" : "dataassetfield_1009",
    "assetId" : "dataasset_1003",
    "fieldName" : "信用额度",
    "fieldType" : "decimal",
    "description" : "系统授予的信用额度上限，单位元，保留两位小数，用于风险控制。",
    "sensitivityLevel" : "敏感",
    "isPrimaryKey" : false,
    "maxLength" : 12
  }, {
    "id" : "dataassetfield_1010",
    "assetId" : "dataasset_1015",
    "fieldName" : "累计消费金额",
    "fieldType" : "decimal",
    "description" : "该客户从开户以来所有成功交易的累计金额，单位元，保留两位小数。",
    "sensitivityLevel" : "敏感",
    "isPrimaryKey" : false,
    "maxLength" : 15
  }, {
    "id" : "dataassetfield_1011",
    "assetId" : "dataasset_1020",
    "fieldName" : "是否为VIP",
    "fieldType" : "boolean",
    "description" : "标记客户是否为VIP会员，VIP享受专属折扣和服务，默认false。",
    "sensitivityLevel" : "机密",
    "isPrimaryKey" : false,
    "maxLength" : 1
  }, {
    "id" : "dataassetfield_1012",
    "assetId" : "dataasset_1010",
    "fieldName" : "部门编号",
    "fieldType" : "string",
    "description" : "客户所属的部门编号，关联公司内部组织架构表，用于多维分析。",
    "sensitivityLevel" : "内部",
    "isPrimaryKey" : true,
    "maxLength" : 20
  }, {
    "id" : "dataassetfield_1013",
    "assetId" : "dataasset_1018",
    "fieldName" : "岗位名称",
    "fieldType" : "string",
    "description" : "客户在公司担任的岗位名称，用于客户画像和职位层级分析。",
    "sensitivityLevel" : "内部",
    "isPrimaryKey" : true,
    "maxLength" : 50
  }, {
    "id" : "dataassetfield_1014",
    "assetId" : "dataasset_1006",
    "fieldName" : "入职日期",
    "fieldType" : "date",
    "description" : "员工入职日期（如果客户是内部员工），格式YYYY-MM-DD，可辅助计算司龄。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : false,
    "maxLength" : 10
  }, {
    "id" : "dataassetfield_1015",
    "assetId" : "dataasset_1002",
    "fieldName" : "薪资级别",
    "fieldType" : "string",
    "description" : "薪资等级，分为初级、中级、高级、资深四个档位，用于薪酬结构分析。",
    "sensitivityLevel" : "内部",
    "isPrimaryKey" : false,
    "maxLength" : 10
  }, {
    "id" : "dataassetfield_1016",
    "assetId" : "dataasset_1005",
    "fieldName" : "绩效考核得分",
    "fieldType" : "decimal",
    "description" : "年度绩效考核综合评分，满分100分，保留一位小数，用于评估员工表现。",
    "sensitivityLevel" : "敏感",
    "isPrimaryKey" : false,
    "maxLength" : 5
  }, {
    "id" : "dataassetfield_1017",
    "assetId" : "dataasset_1008",
    "fieldName" : "备注信息",
    "fieldType" : "text",
    "description" : "其他需要记录的补充信息，支持较长文本，无长度上限但建议控制在500字符内。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : false,
    "maxLength" : 500
  }, {
    "id" : "dataassetfield_1018",
    "assetId" : "dataasset_1009",
    "fieldName" : "记录编号",
    "fieldType" : "string",
    "description" : "每条数据记录的唯一标识，UUID格式，用于快速定位和去重。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : true,
    "maxLength" : 36
  }, {
    "id" : "dataassetfield_1019",
    "assetId" : "dataasset_1015",
    "fieldName" : "会员标识",
    "fieldType" : "string",
    "description" : "会员的业务编码，由字母和数字组成，与记录编号共同构成复合主键。",
    "sensitivityLevel" : "内部",
    "isPrimaryKey" : true,
    "maxLength" : 20
  }, {
    "id" : "dataassetfield_1020",
    "assetId" : "dataasset_1013",
    "fieldName" : "会员名称",
    "fieldType" : "string",
    "description" : "会员的显示名称，支持中文，可重复，前端展示时需脱敏处理。",
    "sensitivityLevel" : "敏感",
    "isPrimaryKey" : false,
    "maxLength" : 50
  }, {
    "id" : "dataassetfield_1021",
    "assetId" : "dataasset_1019",
    "fieldName" : "手机号码",
    "fieldType" : "string",
    "description" : "会员手机号码，存储时采用SM4加密，查询时需通过脱敏函数处理。",
    "sensitivityLevel" : "机密",
    "isPrimaryKey" : true,
    "maxLength" : 20
  }, {
    "id" : "dataassetfield_1022",
    "assetId" : "dataasset_1016",
    "fieldName" : "消费金额",
    "fieldType" : "decimal",
    "description" : "会员最近一次有效消费的金额，单位元，支持两位小数精度。",
    "sensitivityLevel" : "内部",
    "isPrimaryKey" : false,
    "maxLength" : 0
  }, {
    "id" : "dataassetfield_1023",
    "assetId" : "dataasset_1009",
    "fieldName" : "注册日期",
    "fieldType" : "date",
    "description" : "会员完成注册的具体日期，用于统计会员增长趋势和生命周期分析。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : false,
    "maxLength" : 0
  }, {
    "id" : "dataassetfield_1024",
    "assetId" : "dataasset_1004",
    "fieldName" : "是否启用",
    "fieldType" : "boolean",
    "description" : "标识会员账号当前是否处于启用状态，1表示启用，0表示禁用。",
    "sensitivityLevel" : "内部",
    "isPrimaryKey" : false,
    "maxLength" : 0
  }, {
    "id" : "dataassetfield_1025",
    "assetId" : "dataasset_1012",
    "fieldName" : "所在省",
    "fieldType" : "string",
    "description" : "会员注册时填写的所在省份，用于区域分析和精准营销。",
    "sensitivityLevel" : "公开",
    "isPrimaryKey" : false,
    "maxLength" : 20
  }, {
    "id" : "dataassetfield_1026",
    "assetId" : "dataasset_1012",
    "fieldName" : "邮箱",
    "fieldType" : "string",
    "description" : "会员电子邮箱地址，用于接收系统通知和密码重置链接，需校验格式。",
    "sensitivityLevel" : "敏感",
    "isPrimaryKey" : true,
    "maxLength" : 100
  }, {
    "id" : "dataassetfield_1027",
    "assetId" : "dataasset_1021",
    "fieldName" : "信用等级",
    "fieldType" : "string",
    "description" : "基于会员消费行为和履约记录计算的信用评级，分为A/B/C/D四级。",
    "sensitivityLevel" : "机密",
    "isPrimaryKey" : false,
    "maxLength" : 10
  } ],
  "sheji-dataAssetFavorite" : [ {
    "id" : "dataassetfavorite_1000",
    "userId" : "user_1003",
    "assetId" : "dataasset_1002",
    "createdAt" : "2026-03-02 08:30:00"
  }, {
    "id" : "dataassetfavorite_1001",
    "userId" : "user_1006",
    "assetId" : "dataasset_1004",
    "createdAt" : "2026-03-06 10:15:00"
  }, {
    "id" : "dataassetfavorite_1002",
    "userId" : "user_1003",
    "assetId" : "dataasset_1021",
    "createdAt" : "2026-03-10 14:00:00"
  }, {
    "id" : "dataassetfavorite_1003",
    "userId" : "user_1003",
    "assetId" : "dataasset_1021",
    "createdAt" : "2026-03-14 16:45:00"
  }, {
    "id" : "dataassetfavorite_1004",
    "userId" : "user_1007",
    "assetId" : "dataasset_1021",
    "createdAt" : "2026-03-18 19:20:00"
  }, {
    "id" : "dataassetfavorite_1005",
    "userId" : "user_1000",
    "assetId" : "dataasset_1013",
    "createdAt" : "2026-03-22 09:05:00"
  }, {
    "id" : "dataassetfavorite_1006",
    "userId" : "user_1004",
    "assetId" : "dataasset_1009",
    "createdAt" : "2026-03-26 11:30:00"
  }, {
    "id" : "dataassetfavorite_1007",
    "userId" : "user_1001",
    "assetId" : "dataasset_1001",
    "createdAt" : "2026-03-30 13:55:00"
  }, {
    "id" : "dataassetfavorite_1008",
    "userId" : "user_1004",
    "assetId" : "dataasset_1011",
    "createdAt" : "2026-04-03 15:40:00"
  }, {
    "id" : "dataassetfavorite_1009",
    "userId" : "user_1004",
    "assetId" : "dataasset_1012",
    "createdAt" : "2026-04-07 17:10:00"
  }, {
    "id" : "dataassetfavorite_1010",
    "userId" : "user_1006",
    "assetId" : "dataasset_1016",
    "createdAt" : "2026-04-11 08:00:00"
  }, {
    "id" : "dataassetfavorite_1011",
    "userId" : "user_1000",
    "assetId" : "dataasset_1012",
    "createdAt" : "2026-04-15 10:45:00"
  }, {
    "id" : "dataassetfavorite_1012",
    "userId" : "user_1004",
    "assetId" : "dataasset_1013",
    "createdAt" : "2026-04-19 12:20:00"
  }, {
    "id" : "dataassetfavorite_1013",
    "userId" : "user_1007",
    "assetId" : "dataasset_1014",
    "createdAt" : "2026-04-23 14:50:00"
  }, {
    "id" : "dataassetfavorite_1014",
    "userId" : "user_1002",
    "assetId" : "dataasset_1006",
    "createdAt" : "2026-04-27 16:30:00"
  }, {
    "id" : "dataassetfavorite_1015",
    "userId" : "user_1007",
    "assetId" : "dataasset_1010",
    "createdAt" : "2026-05-01 18:15:00"
  }, {
    "id" : "dataassetfavorite_1016",
    "userId" : "user_1003",
    "assetId" : "dataasset_1008",
    "createdAt" : "2026-05-05 07:45:00"
  }, {
    "id" : "dataassetfavorite_1017",
    "userId" : "user_1006",
    "assetId" : "dataasset_1009",
    "createdAt" : "2026-05-09 20:00:00"
  }, {
    "id" : "dataassetfavorite_1018",
    "userId" : "user_1002",
    "assetId" : "dataasset_1014",
    "createdAt" : "2026-03-01 09:15:00"
  }, {
    "id" : "dataassetfavorite_1019",
    "userId" : "user_1002",
    "assetId" : "dataasset_1010",
    "createdAt" : "2026-03-10 14:30:00"
  }, {
    "id" : "dataassetfavorite_1020",
    "userId" : "user_1002",
    "assetId" : "dataasset_1009",
    "createdAt" : "2026-03-20 11:00:00"
  }, {
    "id" : "dataassetfavorite_1021",
    "userId" : "user_1004",
    "assetId" : "dataasset_1005",
    "createdAt" : "2026-04-05 16:45:00"
  }, {
    "id" : "dataassetfavorite_1022",
    "userId" : "user_1003",
    "assetId" : "dataasset_1015",
    "createdAt" : "2026-04-18 08:20:00"
  }, {
    "id" : "dataassetfavorite_1023",
    "userId" : "user_1001",
    "assetId" : "dataasset_1007",
    "createdAt" : "2026-05-06 13:10:00"
  }, {
    "id" : "dataassetfavorite_1024",
    "userId" : "user_1005",
    "assetId" : "dataasset_1006",
    "createdAt" : "2026-05-22 10:30:00"
  } ],
  "sheji-qualityRule" : [ {
    "id" : "qualityrule_1000",
    "name" : "客户信息完整性校验",
    "ruleType" : "完整性",
    "targetAssetId" : "dataasset_1003",
    "status" : "启用",
    "cronExpression" : "0 0 2 * * ?",
    "description" : "检查客户信息表中姓名、身份证号、手机号字段是否为空，每天凌晨2点执行以确保数据完整。"
  }, {
    "id" : "qualityrule_1001",
    "name" : "订单金额准确性校验",
    "ruleType" : "准确性",
    "targetAssetId" : "dataasset_1004",
    "status" : "启用",
    "cronExpression" : "0 0/30 * * * ?",
    "description" : "校验订单表金额字段是否等于商品单价乘以数量，每30分钟扫描异常数据。"
  }, {
    "id" : "qualityrule_1002",
    "name" : "跨系统用户一致性校验",
    "ruleType" : "一致性",
    "targetAssetId" : "dataasset_1019",
    "status" : "停用",
    "cronExpression" : "0 0 0 * * ?",
    "description" : "比对CRM和ERP系统中用户信息，确保姓名、部门、角色字段一致，每天零点执行。"
  }, {
    "id" : "qualityrule_1003",
    "name" : "报表数据及时性校验",
    "ruleType" : "及时性",
    "targetAssetId" : "dataasset_1019",
    "status" : "启用",
    "cronExpression" : "0 0 6 * * ?",
    "description" : "检测昨日业务数据是否在每日6点前完成入仓，超时则告警以保障报表及时性。"
  }, {
    "id" : "qualityrule_1004",
    "name" : "产品属性完整性校验",
    "ruleType" : "完整性",
    "targetAssetId" : "dataasset_1023",
    "status" : "停用",
    "cronExpression" : "0 0 4 * * ?",
    "description" : "校验产品表中名称、规格、分类、图片URL等必填字段是否完整，每天凌晨4点执行。"
  }, {
    "id" : "qualityrule_1005",
    "name" : "库存数量准确性校验",
    "ruleType" : "准确性",
    "targetAssetId" : "dataasset_1018",
    "status" : "启用",
    "cronExpression" : "0 0 1 * * ?",
    "description" : "比对WMS系统库存与ERP账面库存数量是否一致，差异超过阈值时触发告警。"
  }, {
    "id" : "qualityrule_1006",
    "name" : "主数据编码一致性校验",
    "ruleType" : "一致性",
    "targetAssetId" : "dataasset_1022",
    "status" : "停用",
    "cronExpression" : "0 0/15 * * * ?",
    "description" : "检查不同系统间的物料编码、客户编码映射关系是否一致，每15分钟轮询一次。"
  }, {
    "id" : "qualityrule_1007",
    "name" : "接口响应及时性校验",
    "ruleType" : "及时性",
    "targetAssetId" : "dataasset_1003",
    "status" : "停用",
    "cronExpression" : "0 */5 * * * ?",
    "description" : "监控核心数据接口的响应时间是否超过2秒阈值，每5分钟触发一次检查。"
  } ],
  "sheji-detectionResult" : [ {
    "id" : "detectionresult_1000",
    "ruleId" : "qualityrule_1002",
    "executionTime" : "2026-03-01 09:15:00",
    "score" : 95,
    "passed" : true,
    "errorCount" : 0,
    "errorDetails" : [ ],
    "status" : "成功"
  }, {
    "id" : "detectionresult_1001",
    "ruleId" : "qualityrule_1006",
    "executionTime" : "2026-03-15 14:30:00",
    "score" : 88,
    "passed" : true,
    "errorCount" : 0,
    "errorDetails" : [ ],
    "status" : "成功"
  }, {
    "id" : "detectionresult_1002",
    "ruleId" : "qualityrule_1002",
    "executionTime" : "2026-04-10 10:00:00",
    "score" : 100,
    "passed" : true,
    "errorCount" : 0,
    "errorDetails" : [ ],
    "status" : "成功"
  }, {
    "id" : "detectionresult_1003",
    "ruleId" : "qualityrule_1007",
    "executionTime" : "2026-03-20 16:45:00",
    "score" : 23,
    "passed" : false,
    "errorCount" : 2,
    "errorDetails" : [ "字段 'customer_id' 存在空值（缺失 5 条记录）", "字段 'order_date' 格式不一致（混合 YYYY-MM-DD 和 MM/DD/YYYY）" ],
    "status" : "失败"
  }, {
    "id" : "detectionresult_1004",
    "ruleId" : "qualityrule_1005",
    "executionTime" : "2026-04-05 08:20:00",
    "score" : 15,
    "passed" : false,
    "errorCount" : 3,
    "errorDetails" : [ "主键 'order_id' 存在重复值（3 条重复）", "字段 'amount' 包含非数字字符（如 '12.3a'）", "字段 'status' 值不在枚举范围（出现 'unknown'）" ],
    "status" : "失败"
  }, {
    "id" : "detectionresult_1005",
    "ruleId" : "qualityrule_1003",
    "executionTime" : "2026-05-12 11:30:00",
    "score" : 38,
    "passed" : false,
    "errorCount" : 1,
    "errorDetails" : [ "数据表 'sales' 记录数超出阈值（实际 1200，上限 1000）" ],
    "status" : "失败"
  }, {
    "id" : "detectionresult_1006",
    "ruleId" : "qualityrule_1006",
    "executionTime" : "2026-05-20 09:00:00",
    "score" : 62,
    "passed" : false,
    "errorCount" : 0,
    "errorDetails" : [ ],
    "status" : "运行中"
  }, {
    "id" : "detectionresult_1007",
    "ruleId" : "qualityrule_1006",
    "executionTime" : "2026-05-28 14:10:00",
    "score" : 75,
    "passed" : false,
    "errorCount" : 1,
    "errorDetails" : [ "检测任务已执行 70%，部分分区还未完成扫描" ],
    "status" : "运行中"
  } ],
  "sheji-dataStandard" : [ {
    "id" : "datastandard_1000",
    "standardCode" : "STD-202605-001",
    "standardName" : "客户姓名规范",
    "dataType" : "字符串",
    "length" : 50,
    "enumValues" : [ ],
    "businessDomain" : "客户关系",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1001",
    "standardCode" : "STD-202605-002",
    "standardName" : "员工工号编码规则",
    "dataType" : "字符串",
    "length" : 20,
    "enumValues" : [ ],
    "businessDomain" : "人力资源",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1002",
    "standardCode" : "STD-202605-003",
    "standardName" : "订单金额精度标准",
    "dataType" : "小数",
    "length" : 12,
    "enumValues" : [ ],
    "businessDomain" : "供应链",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1003",
    "standardCode" : "STD-202605-004",
    "standardName" : "产品分类代码",
    "dataType" : "枚举",
    "length" : 30,
    "enumValues" : [ "A类", "B类", "C类", "D类" ],
    "businessDomain" : "生产制造",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1004",
    "standardCode" : "STD-202605-005",
    "standardName" : "供应商等级代码",
    "dataType" : "枚举",
    "length" : 10,
    "enumValues" : [ "S级", "A级", "B级", "C级", "D级" ],
    "businessDomain" : "供应链",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1005",
    "standardCode" : "STD-202605-006",
    "standardName" : "出生日期格式",
    "dataType" : "日期",
    "length" : 10,
    "enumValues" : [ ],
    "businessDomain" : "人力资源",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1006",
    "standardCode" : "STD-202605-007",
    "standardName" : "财务科目编码",
    "dataType" : "字符串",
    "length" : 30,
    "enumValues" : [ ],
    "businessDomain" : "财务",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1007",
    "standardCode" : "STD-202605-008",
    "standardName" : "是否启用标识",
    "dataType" : "布尔",
    "length" : 1,
    "enumValues" : [ ],
    "businessDomain" : "数据治理",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1008",
    "standardCode" : "STD-202605-009",
    "standardName" : "质量检测结果",
    "dataType" : "枚举",
    "length" : 10,
    "enumValues" : [ "合格", "不合格", "待复检" ],
    "businessDomain" : "质量",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1009",
    "standardCode" : "STD-202605-010",
    "standardName" : "研发项目编号",
    "dataType" : "字符串",
    "length" : 20,
    "enumValues" : [ ],
    "businessDomain" : "研发",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1010",
    "standardCode" : "STD-202605-011",
    "standardName" : "营销活动类型",
    "dataType" : "枚举",
    "length" : 20,
    "enumValues" : [ "线上促销", "线下推广", "品牌合作", "会员活动" ],
    "businessDomain" : "营销",
    "status" : "已废弃"
  }, {
    "id" : "datastandard_1011",
    "standardCode" : "STD-202605-012",
    "standardName" : "IT设备资产编号",
    "dataType" : "字符串",
    "length" : 30,
    "enumValues" : [ ],
    "businessDomain" : "IT运维",
    "status" : "已废弃"
  }, {
    "id" : "datastandard_1012",
    "standardCode" : "STD-202605-013",
    "standardName" : "客户风险评级",
    "dataType" : "整数",
    "length" : 4,
    "enumValues" : [ ],
    "businessDomain" : "风控",
    "status" : "草稿"
  }, {
    "id" : "datastandard_1013",
    "standardCode" : "STD-202605-014",
    "standardName" : "税率标准值",
    "dataType" : "小数",
    "length" : 10,
    "enumValues" : [ ],
    "businessDomain" : "财务",
    "status" : "草稿"
  }, {
    "id" : "datastandard_1014",
    "standardCode" : "STD-202605-015",
    "standardName" : "合同文本字段长度",
    "dataType" : "文本",
    "length" : 4000,
    "enumValues" : [ ],
    "businessDomain" : "法务",
    "status" : "草稿"
  }, {
    "id" : "datastandard_1015",
    "standardCode" : "STD-202605-016",
    "standardName" : "产品批次号规则",
    "dataType" : "字符串",
    "length" : 40,
    "enumValues" : [ ],
    "businessDomain" : "生产制造",
    "status" : "草稿"
  }, {
    "id" : "datastandard_1016",
    "standardCode" : "STD-202605-017",
    "standardName" : "员工状态标识",
    "dataType" : "枚举",
    "length" : 10,
    "enumValues" : [ "在职", "离职", "退休", "停薪留职" ],
    "businessDomain" : "人力资源",
    "status" : "已废弃"
  }, {
    "id" : "datastandard_1017",
    "standardCode" : "STD-202605-018",
    "standardName" : "数据质量等级",
    "dataType" : "枚举",
    "length" : 10,
    "enumValues" : [ "高", "中", "低" ],
    "businessDomain" : "数据治理",
    "status" : "草稿"
  }, {
    "id" : "datastandard_1018",
    "standardCode" : "STD-FIN-006",
    "standardName" : "财务科目编号标准-短整型",
    "dataType" : "smallint",
    "length" : 4,
    "enumValues" : [ ],
    "businessDomain" : "财务",
    "status" : "草稿"
  }, {
    "id" : "datastandard_1019",
    "standardCode" : "STD-HR-012",
    "standardName" : "员工性别代码标准-VARCHAR",
    "dataType" : "varchar",
    "length" : 20,
    "enumValues" : [ "男", "女" ],
    "businessDomain" : "人力资源",
    "status" : "已发布"
  }, {
    "id" : "datastandard_1020",
    "standardCode" : "STD-SCM-009",
    "standardName" : "供应商物资分类标准-DECIMAL",
    "dataType" : "decimal",
    "length" : 10,
    "enumValues" : [ "A类", "B类", "C类" ],
    "businessDomain" : "供应链",
    "status" : "已废弃"
  } ],
  "sheji-integrationPlan" : [ {
    "id" : "integrationplan_1000",
    "name" : "月度销售订单ETL同步",
    "taskType" : "ETL",
    "cronExpression" : "0 0 2 1 * ?",
    "dependencies" : [ ],
    "retryPolicy" : {
      "maxRetries" : 3,
      "retryIntervalMinutes" : 5,
      "exponentialBackoff" : true
    },
    "status" : "启用",
    "description" : "每月1日凌晨2点从SAP ERP抽取销售订单数据，经过清洗转换后加载到企业数据仓库，用于月度经营分析。"
  }, {
    "id" : "integrationplan_1001",
    "name" : "客户主数据同步至数仓",
    "taskType" : "数据同步",
    "cronExpression" : "0 30 8 * * MON-FRI",
    "dependencies" : [ "月度销售订单ETL同步" ],
    "retryPolicy" : {
      "maxRetries" : 2,
      "retryIntervalMinutes" : 10,
      "exponentialBackoff" : false
    },
    "status" : "启用",
    "description" : "每周一到周五8:30将CRM系统更新的客户主数据增量同步到数据仓库，保证客户信息实时一致。"
  }, {
    "id" : "integrationplan_1002",
    "name" : "日志清洗归档任务",
    "taskType" : "数据清洗",
    "cronExpression" : "0 0/30 * * * ?",
    "dependencies" : [ ],
    "retryPolicy" : {
      "maxRetries" : 5,
      "retryIntervalMinutes" : 1,
      "exponentialBackoff" : true
    },
    "status" : "启用",
    "description" : "每30分钟对应用服务器产生的原始日志进行格式标准化、去重和敏感信息脱敏，并压缩归档至冷存储。"
  }, {
    "id" : "integrationplan_1003",
    "name" : "库存变动实时同步",
    "taskType" : "数据同步",
    "cronExpression" : "0 0/5 * * * ?",
    "dependencies" : [ "客户主数据同步至数仓" ],
    "retryPolicy" : {
      "maxRetries" : 4,
      "retryIntervalMinutes" : 2,
      "exponentialBackoff" : true
    },
    "status" : "启用",
    "description" : "每5分钟从WMS系统同步库存变动数据至实时分析层，支撑库存看板与预警，延迟不超过1分钟。"
  }, {
    "id" : "integrationplan_1004",
    "name" : "财务凭证ETL清洗转换",
    "taskType" : "ETL",
    "cronExpression" : "0 0 3 * * ?",
    "dependencies" : [ "月度销售订单ETL同步", "客户主数据同步至数仓" ],
    "retryPolicy" : {
      "maxRetries" : 3,
      "retryIntervalMinutes" : 15,
      "exponentialBackoff" : false
    },
    "status" : "停用",
    "description" : "每日凌晨3点抽取财务模块凭证数据，按照会计准则进行科目映射和金额校验，加载到总账分析表。"
  }, {
    "id" : "integrationplan_1005",
    "name" : "设备运行数据清洗",
    "taskType" : "数据清洗",
    "cronExpression" : "0 0 0/2 * * ?",
    "dependencies" : [ ],
    "retryPolicy" : {
      "maxRetries" : 6,
      "retryIntervalMinutes" : 3,
      "exponentialBackoff" : true
    },
    "status" : "启用",
    "description" : "每2小时对IoT平台采集的设备振动、温度数据进行异常值过滤、缺失值插补和单位归一化处理。"
  }, {
    "id" : "integrationplan_1006",
    "name" : "HR组织架构每日同步",
    "taskType" : "数据同步",
    "cronExpression" : "0 0 6 * * ?",
    "dependencies" : [ ],
    "retryPolicy" : {
      "maxRetries" : 2,
      "retryIntervalMinutes" : 20,
      "exponentialBackoff" : false
    },
    "status" : "启用",
    "description" : "每日6点从HRIS系统全量同步组织架构、岗位和人员信息至数据中台，确保权限系统和报表基础数据准确。"
  }, {
    "id" : "integrationplan_1007",
    "name" : "产品质量检测数据ETL",
    "taskType" : "ETL",
    "cronExpression" : "0 30 1 * * ?",
    "dependencies" : [ "日志清洗归档任务" ],
    "retryPolicy" : {
      "maxRetries" : 3,
      "retryIntervalMinutes" : 8,
      "exponentialBackoff" : true
    },
    "status" : "启用",
    "description" : "每天凌晨1:30从MES系统抽取产品抽检结果、不合格记录，转换为质量分析标准格式，更新质量看板。"
  }, {
    "id" : "integrationplan_1008",
    "name" : "电商订单数据清洗",
    "taskType" : "数据清洗",
    "cronExpression" : "0 0/15 * * * ?",
    "dependencies" : [ "月度销售订单ETL同步" ],
    "retryPolicy" : {
      "maxRetries" : 4,
      "retryIntervalMinutes" : 5,
      "exponentialBackoff" : true
    },
    "status" : "停用",
    "description" : "每15分钟清洗各电商平台订单数据，去除测试订单、合并重复订单、补全缺失的物流信息后入仓。"
  }, {
    "id" : "integrationplan_1009",
    "name" : "供应商主数据同步",
    "taskType" : "数据同步",
    "cronExpression" : "0 0 0 1 * ?",
    "dependencies" : [ ],
    "retryPolicy" : {
      "maxRetries" : 1,
      "retryIntervalMinutes" : 30,
      "exponentialBackoff" : false
    },
    "status" : "停用",
    "description" : "每月1日零时从SCM系统全量同步供应商基本信息、资质文件和合作状态，更新供应商主数据表。"
  }, {
    "id" : "integrationplan_1010",
    "name" : "生产报工数据ETL入库",
    "taskType" : "ETL",
    "cronExpression" : "0 0 23 * * ?",
    "dependencies" : [ ],
    "retryPolicy" : {
      "maxRetries" : 3,
      "retryIntervalMinutes" : 10,
      "exponentialBackoff" : true
    },
    "status" : "停用",
    "description" : "每晚23点从生产执行系统抽取当日员工报工记录，按工单和工序进行归集，加载到工时成本分析表。"
  } ],
  "sheji-executionLog" : [ {
    "id" : "executionlog_1000",
    "planId" : "integrationplan_1008",
    "startTime" : "2026-03-02 08:30:00",
    "endTime" : "2026-03-02 08:45:00",
    "status" : "成功",
    "logContent" : "成功完成从MySQL订单库到数据仓库的订单增量同步，本次抽取12,358条记录，目标表orders_snapshot写入12,358行，无错误，耗时15分12秒。"
  }, {
    "id" : "executionlog_1001",
    "planId" : "integrationplan_1002",
    "startTime" : "2026-03-05 14:15:00",
    "endTime" : "2026-03-05 14:30:00",
    "status" : "失败",
    "logContent" : "从ERP同步采购订单失败，失败原因：目标表'ods_purchase_orders'字段'remark'长度限制255，但源端提供字段长度800，触发数据截断异常，错误代码ORA-12899。"
  }, {
    "id" : "executionlog_1002",
    "planId" : "integrationplan_1003",
    "startTime" : "2026-03-10 09:00:00",
    "endTime" : "2026-03-10 09:01:00",
    "status" : "运行中",
    "logContent" : "正在执行CRM客户数据清洗脚本，当前阶段：地址标准化校验，已处理12,000条记录中的5,340条，预计剩余8分钟。"
  }, {
    "id" : "executionlog_1003",
    "planId" : "integrationplan_1002",
    "startTime" : "2026-03-15 10:30:00",
    "endTime" : "2026-03-15 10:55:00",
    "status" : "成功",
    "logContent" : "成功完成财务凭证历史数据归档，将2024年凭证从生产库迁移至归档库，共迁移56,789条凭证分录，数据校验一致，耗时25分钟。"
  }, {
    "id" : "executionlog_1004",
    "planId" : "integrationplan_1001",
    "startTime" : "2026-03-20 16:45:00",
    "endTime" : "2026-03-20 17:00:00",
    "status" : "失败",
    "logContent" : "从HR系统同步员工组织架构失败，失败原因：源端API返回HTTP 503服务不可用，重试3次后仍失败，已记录断点偏移量，待下一次调度自动续传。"
  }, {
    "id" : "executionlog_1005",
    "planId" : "integrationplan_1005",
    "startTime" : "2026-03-25 11:00:00",
    "endTime" : "2026-03-25 11:01:00",
    "status" : "运行中",
    "logContent" : "正在执行ETL作业'数据质量检查'，当前阶段：空值率扫描，已检查表dim_customer（2,150万行）的35%分区，发现缺失率超过阈值的字段：email（12.3%）。"
  }, {
    "id" : "executionlog_1006",
    "planId" : "integrationplan_1009",
    "startTime" : "2026-04-02 08:00:00",
    "endTime" : "2026-04-02 08:35:00",
    "status" : "成功",
    "logContent" : "成功完成从物流系统到数据湖的轨迹数据全量同步，共处理1,234,567条GPS记录，目标表ods_logistics_tracks写入1,234,567行，耗时35分钟，无错误。"
  }, {
    "id" : "executionlog_1007",
    "planId" : "integrationplan_1001",
    "startTime" : "2026-04-08 12:30:00",
    "endTime" : "2026-04-08 12:50:00",
    "status" : "失败",
    "logContent" : "从OA系统同步审批流程数据失败，失败原因：源端数据库连接池耗尽，'max pool size'为50但当前活跃连接已达上限，等待超时60秒后放弃。"
  }, {
    "id" : "executionlog_1008",
    "planId" : "integrationplan_1004",
    "startTime" : "2026-04-15 14:20:00",
    "endTime" : "2026-04-15 14:21:00",
    "status" : "运行中",
    "logContent" : "正在执行数据脱敏脚本对生产库客户手机号进行掩码处理，当前进度40%，已完成处理表3张（user_profile, order_contact, delivery_contact），预计剩余15分钟。"
  }, {
    "id" : "executionlog_1009",
    "planId" : "integrationplan_1009",
    "startTime" : "2026-04-20 09:15:00",
    "endTime" : "2026-04-20 09:45:00",
    "status" : "成功",
    "logContent" : "成功完成数据仓库维度表全量刷新，更新dim_date增加2027-2028年日期，dim_product新增300个SKU，dim_store同步门店关停信息，操作逐表提交，耗时30分钟。"
  }, {
    "id" : "executionlog_1010",
    "planId" : "integrationplan_1007",
    "startTime" : "2026-04-25 10:10:00",
    "endTime" : "2026-04-25 10:30:00",
    "status" : "失败",
    "logContent" : "从物联网平台同步设备告警数据失败，失败原因：源端数据格式变更，新增字段'alert_level'为枚举类型但未在映射中定义，导致解析器抛出SchemaMismatchException。"
  }, {
    "id" : "executionlog_1011",
    "planId" : "integrationplan_1003",
    "startTime" : "2026-05-02 15:00:00",
    "endTime" : "2026-05-02 15:01:00",
    "status" : "运行中",
    "logContent" : "正在执行数据备份任务，源库：prod_db (MySQL 8.0)，目标：nas_backup，当前阶段：备份表inventory_warehouse（约800万行），已完成60%，磁盘写入速率120MB/s。"
  }, {
    "id" : "executionlog_1012",
    "planId" : "integrationplan_1010",
    "startTime" : "2026-05-08 11:30:00",
    "endTime" : "2026-05-08 11:55:00",
    "status" : "成功",
    "logContent" : "成功完成从第三方支付系统到财务中台的交易对账，匹配成功18,923笔，异常2笔（金额不一致），已生成差异报表并发送至财务负责人邮箱。"
  }, {
    "id" : "executionlog_1013",
    "planId" : "integrationplan_1002",
    "startTime" : "2026-05-12 13:45:00",
    "endTime" : "2026-05-12 14:05:00",
    "status" : "失败",
    "logContent" : "从邮件系统同步附件数据失败，失败原因：邮件服务器磁盘空间满（剩余0%），无法读取附件内容，需管理员清理后再重新运行。"
  }, {
    "id" : "executionlog_1014",
    "planId" : "integrationplan_1003",
    "startTime" : "2026-05-18 16:00:00",
    "endTime" : "2026-05-18 16:01:00",
    "status" : "运行中",
    "logContent" : "正在执行数据血缘解析任务，对新的ETL脚本（/etl/transform/daily_sales.py）进行静态分析，已解析26个节点中的18个，发现2个潜在的循环依赖。"
  }, {
    "id" : "executionlog_1015",
    "planId" : "integrationplan_1002",
    "startTime" : "2026-05-22 09:30:00",
    "endTime" : "2026-05-22 10:00:00",
    "status" : "成功",
    "logContent" : "成功完成实时数据流（Kafka topic：event_click）到时序数据库的归档，共消费并写入4,567,890条事件，平均延时120ms，无积压。"
  }, {
    "id" : "executionlog_1016",
    "planId" : "integrationplan_1007",
    "startTime" : "2026-05-25 10:00:00",
    "endTime" : "2026-05-25 10:20:00",
    "status" : "失败",
    "logContent" : "从邮件系统同步附件数据失败，失败原因：邮件服务器磁盘空间满（剩余0%），无法读取附件内容，需管理员清理后再重新运行。"
  }, {
    "id" : "executionlog_1017",
    "planId" : "integrationplan_1000",
    "startTime" : "2026-05-28 08:00:00",
    "endTime" : "2026-05-28 08:01:00",
    "status" : "运行中",
    "logContent" : "正在执行数据平台自检任务，包括元数据一致性检查、权限过期预警、存储水位线扫描，当前进度15%，已发现3张表元数据版本不一致。"
  }, {
    "id" : "executionlog_1018",
    "planId" : "integrationplan_1002",
    "startTime" : "2026-03-01 09:15:30",
    "endTime" : "2026-03-01 09:45:20",
    "status" : "成功",
    "logContent" : "数据源MYSQL_01增量抽取完成，共处理记录15,234条，耗时29分50秒，无异常。"
  }, {
    "id" : "executionlog_1019",
    "planId" : "integrationplan_1009",
    "startTime" : "2026-03-05 14:00:00",
    "endTime" : "2026-03-05 14:35:10",
    "status" : "失败",
    "logContent" : "FTP文件读取失败：文件'import_20260305.csv'格式校验未通过，字段数不一致，请检查源文件。"
  }, {
    "id" : "executionlog_1020",
    "planId" : "integrationplan_1009",
    "startTime" : "2026-03-10 22:10:00",
    "endTime" : "2026-03-10 23:59:59",
    "status" : "运行中",
    "logContent" : "大数据聚合任务正在执行中，当前处理进度35%，预计还需约8分钟完成。"
  }, {
    "id" : "executionlog_1021",
    "planId" : "integrationplan_1002",
    "startTime" : "2026-03-18 08:30:00",
    "endTime" : "2026-03-18 09:02:45",
    "status" : "成功",
    "logContent" : "数据清洗任务完成，过滤无效数据1,234条，标准化字段23个，输出至清洗库。"
  }, {
    "id" : "executionlog_1022",
    "planId" : "integrationplan_1008",
    "startTime" : "2026-03-25 16:45:00",
    "endTime" : "2026-03-25 17:30:00",
    "status" : "失败",
    "logContent" : "API接口调用超时（请求URL:/api/v1/data/sync），重试3次均失败，原因：连接池耗尽。"
  }, {
    "id" : "executionlog_1023",
    "planId" : "integrationplan_1002",
    "startTime" : "2026-04-02 11:00:00",
    "endTime" : "2026-04-02 23:59:59",
    "status" : "运行中",
    "logContent" : "实时流数据处理任务启动，Kafka消费组'plan-08'已连接到topic 'data-raw'。"
  }, {
    "id" : "executionlog_1024",
    "planId" : "integrationplan_1001",
    "startTime" : "2026-04-10 13:20:00",
    "endTime" : "2026-04-10 14:08:30",
    "status" : "成功",
    "logContent" : "数据脱敏任务完成，对客户表'customer_info'中手机号、身份证号进行掩码处理，处理记录5,678条。"
  }, {
    "id" : "executionlog_1025",
    "planId" : "integrationplan_1003",
    "startTime" : "2026-04-18 09:00:00",
    "endTime" : "2026-04-18 09:45:00",
    "status" : "失败",
    "logContent" : "数据质量检查发现重复数据：表'order_detail'存在3,456条完全重复记录，超出阈值，任务终止。"
  }, {
    "id" : "executionlog_1026",
    "planId" : "integrationplan_1005",
    "startTime" : "2026-04-25 17:30:00",
    "endTime" : "2026-04-25 18:15:20",
    "status" : "成功",
    "logContent" : "数据归档任务完成，将2025年历史数据迁移至HDFS冷存储，归档表8个，释放空间约12GB。"
  }, {
    "id" : "executionlog_1027",
    "planId" : "integrationplan_1010",
    "startTime" : "2026-05-12 10:00:00",
    "endTime" : "2026-05-12 10:25:00",
    "status" : "失败",
    "logContent" : "数据同步任务中断：目标数据库空间不足，剩余可用空间仅200MB，无法写入数据。"
  }, {
    "id" : "executionlog_1028",
    "planId" : "integrationplan_1005",
    "startTime" : "2026-05-20 15:00:00",
    "endTime" : "2026-05-20 23:59:59",
    "status" : "运行中",
    "logContent" : "全量数据加载任务正在运行，已加载表12/25，当前进度48%，预计剩余时间约20分钟。"
  }, {
    "id" : "executionlog_1029",
    "planId" : "integrationplan_1009",
    "startTime" : "2026-05-28 08:00:00",
    "endTime" : "2026-05-28 23:59:59",
    "status" : "运行中",
    "logContent" : "每日数据质量报告生成任务启动，正在采集8个数据源指标，预计午间完成。"
  } ],
  "sheji-apiDefinition" : [ {
    "id" : "apidefinition_1000",
    "name" : "获取数据资产列表",
    "path" : "/api/v1/data-assets",
    "method" : "GET",
    "requestParams" : [ {
      "name" : "page",
      "type" : "integer",
      "required" : false,
      "description" : "当前页码，从1开始"
    }, {
      "name" : "size",
      "type" : "integer",
      "required" : false,
      "description" : "每页条数，默认20"
    }, {
      "name" : "keyword",
      "type" : "string",
      "required" : false,
      "description" : "搜索关键字，按资产名称或描述模糊匹配"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "状态码，200表示成功"
        },
        "data" : {
          "type" : "array",
          "items" : {
            "type" : "object",
            "properties" : {
              "id" : "string",
              "name" : "string",
              "assetType" : "string",
              "createdAt" : "string"
            }
          }
        },
        "total" : {
          "type" : "integer",
          "description" : "总记录数"
        }
      }
    },
    "status" : "已发布",
    "version" : "1.0.0"
  }, {
    "id" : "apidefinition_1001",
    "name" : "创建数据资产",
    "path" : "/api/v1/data-assets",
    "method" : "POST",
    "requestParams" : [ {
      "name" : "body",
      "type" : "object",
      "required" : true,
      "description" : "数据资产创建信息，包含name、assetType、description、tags等字段"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "201创建成功"
        },
        "data" : {
          "type" : "object",
          "properties" : {
            "id" : "string",
            "name" : "string",
            "assetType" : "string"
          }
        }
      }
    },
    "status" : "待审核",
    "version" : "1.1.0"
  }, {
    "id" : "apidefinition_1002",
    "name" : "更新数据资产",
    "path" : "/api/v1/data-assets/{id}",
    "method" : "PUT",
    "requestParams" : [ {
      "name" : "id",
      "type" : "string",
      "required" : true,
      "description" : "数据资产ID，路径参数"
    }, {
      "name" : "body",
      "type" : "object",
      "required" : true,
      "description" : "待更新的资产字段，支持部分更新"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "200更新成功"
        },
        "data" : {
          "type" : "object",
          "properties" : {
            "id" : "string",
            "updatedAt" : "string"
          }
        }
      }
    },
    "status" : "已发布",
    "version" : "1.2.0"
  }, {
    "id" : "apidefinition_1003",
    "name" : "删除数据资产",
    "path" : "/api/v1/data-assets/{id}",
    "method" : "DELETE",
    "requestParams" : [ {
      "name" : "id",
      "type" : "string",
      "required" : true,
      "description" : "数据资产ID，路径参数"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "200删除成功"
        },
        "message" : {
          "type" : "string",
          "description" : "操作提示"
        }
      }
    },
    "status" : "已下架",
    "version" : "1.0.0"
  }, {
    "id" : "apidefinition_1004",
    "name" : "获取质量规则列表",
    "path" : "/api/v1/data-quality/rules",
    "method" : "GET",
    "requestParams" : [ {
      "name" : "page",
      "type" : "integer",
      "required" : false,
      "description" : "页码"
    }, {
      "name" : "size",
      "type" : "integer",
      "required" : false,
      "description" : "每页条数"
    }, {
      "name" : "ruleType",
      "type" : "string",
      "required" : false,
      "description" : "规则类型：完整性/准确性/一致性/及时性"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer"
        },
        "data" : {
          "type" : "array",
          "items" : {
            "type" : "object",
            "properties" : {
              "id" : "string",
              "name" : "string",
              "ruleType" : "string",
              "status" : "string"
            }
          }
        },
        "total" : {
          "type" : "integer"
        }
      }
    },
    "status" : "已发布",
    "version" : "2.0.0"
  }, {
    "id" : "apidefinition_1005",
    "name" : "创建质量规则",
    "path" : "/api/v1/data-quality/rules",
    "method" : "POST",
    "requestParams" : [ {
      "name" : "body",
      "type" : "object",
      "required" : true,
      "description" : "规则配置，包含name、ruleType、targetTable、expression、severity等"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "201"
        },
        "data" : {
          "type" : "object",
          "properties" : {
            "id" : "string",
            "name" : "string"
          }
        }
      }
    },
    "status" : "待审核",
    "version" : "1.0.0"
  }, {
    "id" : "apidefinition_1006",
    "name" : "更新质量规则",
    "path" : "/api/v1/data-quality/rules/{id}",
    "method" : "PUT",
    "requestParams" : [ {
      "name" : "id",
      "type" : "string",
      "required" : true,
      "description" : "规则ID，路径参数"
    }, {
      "name" : "body",
      "type" : "object",
      "required" : true,
      "description" : "需要更新的规则字段"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer"
        },
        "data" : {
          "type" : "object",
          "properties" : {
            "id" : "string",
            "updatedAt" : "string"
          }
        }
      }
    },
    "status" : "草稿",
    "version" : "1.0.0"
  }, {
    "id" : "apidefinition_1007",
    "name" : "删除质量规则",
    "path" : "/api/v1/data-quality/rules/{id}",
    "method" : "DELETE",
    "requestParams" : [ {
      "name" : "id",
      "type" : "string",
      "required" : true,
      "description" : "规则ID，路径参数"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "200"
        },
        "message" : {
          "type" : "string",
          "description" : "删除成功提示"
        }
      }
    },
    "status" : "已下架",
    "version" : "1.0.0"
  }, {
    "id" : "apidefinition_1008",
    "name" : "获取标签列表",
    "path" : "/api/v1/data-catalog/tags",
    "method" : "GET",
    "requestParams" : [ {
      "name" : "category",
      "type" : "string",
      "required" : false,
      "description" : "标签分类：业务域/技术域/安全域"
    }, {
      "name" : "page",
      "type" : "integer",
      "required" : false,
      "description" : "页码"
    }, {
      "name" : "size",
      "type" : "integer",
      "required" : false,
      "description" : "每页条数"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer"
        },
        "data" : {
          "type" : "array",
          "items" : {
            "type" : "object",
            "properties" : {
              "id" : "string",
              "name" : "string",
              "category" : "string",
              "color" : "string"
            }
          }
        },
        "total" : {
          "type" : "integer"
        }
      }
    },
    "status" : "待审核",
    "version" : "1.2.0"
  }, {
    "id" : "apidefinition_1009",
    "name" : "触发元数据同步",
    "path" : "/api/v1/metadata/sync",
    "method" : "POST",
    "requestParams" : [ {
      "name" : "body",
      "type" : "object",
      "required" : true,
      "description" : "同步配置，包含sourceType（如Hive/MySQL/Spark）、connectionId、tableFilter等"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "202异步任务已提交"
        },
        "data" : {
          "type" : "object",
          "properties" : {
            "taskId" : "string",
            "status" : "string"
          }
        }
      }
    },
    "status" : "草稿",
    "version" : "1.0.0"
  }, {
    "id" : "apidefinition_1010",
    "name" : "批量更新规则状态",
    "path" : "/api/v1/data-quality/rules/{id}/status",
    "method" : "PUT",
    "requestParams" : [ {
      "name" : "id",
      "type" : "string",
      "required" : true,
      "description" : "规则ID，路径参数"
    }, {
      "name" : "body",
      "type" : "object",
      "required" : true,
      "description" : "包含status字段：启用/禁用/归档"
    } ],
    "responseFormat" : {
      "type" : "object",
      "properties" : {
        "code" : {
          "type" : "integer",
          "description" : "200"
        },
        "data" : {
          "type" : "object",
          "properties" : {
            "id" : "string",
            "status" : "string",
            "updatedAt" : "string"
          }
        }
      }
    },
    "status" : "草稿",
    "version" : "1.1.0"
  } ],
  "sheji-grantApplication" : [ {
    "id" : "grantapplication_1000",
    "applicantId" : "user_1005",
    "apiId" : "apidefinition_1004",
    "reason" : "需要调用实时交易流水API用于风控模型训练，预计每天调用5000次。",
    "status" : "待审批",
    "createdAt" : "2026-03-05 09:15:00",
    "updatedAt" : "2026-03-05 09:15:00"
  }, {
    "id" : "grantapplication_1001",
    "applicantId" : "user_1000",
    "apiId" : "apidefinition_1003",
    "reason" : "集成供应链管理系统，需获取库存变动通知接口，便于实时更新库存状态。",
    "status" : "已通过",
    "createdAt" : "2026-03-12 10:30:00",
    "updatedAt" : "2026-03-14 14:22:00"
  }, {
    "id" : "grantapplication_1002",
    "applicantId" : "user_1003",
    "apiId" : "apidefinition_1009",
    "reason" : "开发数据分析仪表盘，申请访问用户行为数据聚合API，需求较紧急。",
    "status" : "已驳回",
    "createdAt" : "2026-03-20 11:00:00",
    "updatedAt" : "2026-03-22 16:45:00"
  }, {
    "id" : "grantapplication_1003",
    "applicantId" : "user_1007",
    "apiId" : "apidefinition_1001",
    "reason" : "外部合作伙伴需通过接口获取订单状态，申请开放查询权限。",
    "status" : "已撤销",
    "createdAt" : "2026-04-01 08:00:00",
    "updatedAt" : "2026-04-03 09:30:00"
  }, {
    "id" : "grantapplication_1004",
    "applicantId" : "user_1003",
    "apiId" : "apidefinition_1007",
    "reason" : "测试环境需要调用商品信息API进行自动化测试，测试周期两周。",
    "status" : "待审批",
    "createdAt" : "2026-04-10 13:20:00",
    "updatedAt" : "2026-04-10 13:20:00"
  }, {
    "id" : "grantapplication_1005",
    "applicantId" : "user_1003",
    "apiId" : "apidefinition_1009",
    "reason" : "数据分析团队申请获取用户画像数据接口，用于精准营销模型优化。",
    "status" : "已通过",
    "createdAt" : "2026-04-18 09:45:00",
    "updatedAt" : "2026-04-20 11:00:00"
  }, {
    "id" : "grantapplication_1006",
    "applicantId" : "user_1003",
    "apiId" : "apidefinition_1008",
    "reason" : "申请调用物流轨迹跟踪API，以提供客户实时物流信息查询服务。",
    "status" : "已驳回",
    "createdAt" : "2026-04-25 10:00:00",
    "updatedAt" : "2026-04-27 15:30:00"
  }, {
    "id" : "grantapplication_1007",
    "applicantId" : "user_1001",
    "apiId" : "apidefinition_1000",
    "reason" : "移动端APP需要调用用户登录验证接口，日均请求量预计1万次。",
    "status" : "待审批",
    "createdAt" : "2026-05-06 14:00:00",
    "updatedAt" : "2026-05-06 14:00:00"
  }, {
    "id" : "grantapplication_1008",
    "applicantId" : "user_1004",
    "apiId" : "apidefinition_1004",
    "reason" : "新上线的促销活动需实时获取商品库存数据，申请调用库存查询API。",
    "status" : "已通过",
    "createdAt" : "2026-05-15 08:30:00",
    "updatedAt" : "2026-05-17 10:15:00"
  }, {
    "id" : "grantapplication_1009",
    "applicantId" : "user_1004",
    "apiId" : "apidefinition_1007",
    "reason" : "项目结束，不再需要调用用户行为分析API，撤销之前申请。",
    "status" : "已撤销",
    "createdAt" : "2026-05-20 09:00:00",
    "updatedAt" : "2026-05-22 11:45:00"
  } ],
  "sheji-approvalRecord" : [ {
    "id" : "approvalrecord_1000",
    "bizType" : "资产发布",
    "bizId" : "ASSET-20260301-001",
    "approverId" : "user_1003",
    "action" : "通过",
    "comment" : "数据资产元数据完整，字段描述清晰，同意发布至数据资产目录。",
    "createdAt" : "2026-02-28 09:15:00"
  }, {
    "id" : "approvalrecord_1001",
    "bizType" : "资产发布",
    "bizId" : "ASSET-20260305-002",
    "approverId" : "user_1006",
    "action" : "驳回",
    "comment" : "敏感字段分级未标注，缺少数据安全等级，请补充后重新提交。",
    "createdAt" : "2026-03-03 14:20:30"
  }, {
    "id" : "approvalrecord_1002",
    "bizType" : "资产发布",
    "bizId" : "ASSET-20260310-003",
    "approverId" : "user_1007",
    "action" : "通过",
    "comment" : "资产说明详细，样例数据已脱敏，同意入库并开放查询。",
    "createdAt" : "2026-03-08 11:05:45"
  }, {
    "id" : "approvalrecord_1003",
    "bizType" : "资产发布",
    "bizId" : "ASSET-20260315-004",
    "approverId" : "user_1003",
    "action" : "驳回",
    "comment" : "数据血缘图谱缺失，无法验证数据来源可靠性，暂不通过。",
    "createdAt" : "2026-03-12 16:40:12"
  }, {
    "id" : "approvalrecord_1004",
    "bizType" : "资产发布",
    "bizId" : "ASSET-20260320-005",
    "approverId" : "user_1006",
    "action" : "通过",
    "comment" : "质检报告附件齐全，数据质量评分98分，同意发布。",
    "createdAt" : "2026-03-18 10:30:00"
  }, {
    "id" : "approvalrecord_1005",
    "bizType" : "资产发布",
    "bizId" : "ASSET-20260325-006",
    "approverId" : "user_1003",
    "action" : "驳回",
    "comment" : "目录分类选择错误，本应归入业务域而非技术域，请修正。",
    "createdAt" : "2026-03-22 09:00:25"
  }, {
    "id" : "approvalrecord_1006",
    "bizType" : "API发布",
    "bizId" : "API-20260401-001",
    "approverId" : "user_1007",
    "action" : "通过",
    "comment" : "接口文档规范，请求/响应参数完整，安全鉴权方案合理，同意发布。",
    "createdAt" : "2026-03-28 14:55:10"
  }, {
    "id" : "approvalrecord_1007",
    "bizType" : "API发布",
    "bizId" : "API-20260405-002",
    "approverId" : "user_1007",
    "action" : "驳回",
    "comment" : "未提供流量限制策略，高并发场景可能影响系统稳定性，驳回。",
    "createdAt" : "2026-04-02 11:20:33"
  }, {
    "id" : "approvalrecord_1008",
    "bizType" : "API发布",
    "bizId" : "API-20260410-003",
    "approverId" : "user_1006",
    "action" : "通过",
    "comment" : "测试覆盖率90%以上，压测报告通过，同意上线。",
    "createdAt" : "2026-04-07 16:10:00"
  }, {
    "id" : "approvalrecord_1009",
    "bizType" : "API发布",
    "bizId" : "API-20260415-004",
    "approverId" : "user_1002",
    "action" : "驳回",
    "comment" : "响应字段存在JSON循环引用，需修复后重新审查。",
    "createdAt" : "2026-04-12 08:45:50"
  }, {
    "id" : "approvalrecord_1010",
    "bizType" : "API发布",
    "bizId" : "API-20260420-005",
    "approverId" : "user_1000",
    "action" : "通过",
    "comment" : "API版本号规范，已与消费者确认向下兼容，同意发布。",
    "createdAt" : "2026-04-17 13:30:22"
  }, {
    "id" : "approvalrecord_1011",
    "bizType" : "API发布",
    "bizId" : "API-20260425-006",
    "approverId" : "user_1001",
    "action" : "驳回",
    "comment" : "缺少错误码枚举定义，调用方无法处理异常情况，请补充。",
    "createdAt" : "2026-04-22 10:05:14"
  }, {
    "id" : "approvalrecord_1012",
    "bizType" : "授权申请",
    "bizId" : "AUTH-20260501-001",
    "approverId" : "user_1005",
    "action" : "通过",
    "comment" : "申请理由充分，数据使用范围合理，同意授予三个月访问权限。",
    "createdAt" : "2026-04-27 15:40:00"
  }, {
    "id" : "approvalrecord_1013",
    "bizType" : "授权申请",
    "bizId" : "AUTH-20260505-002",
    "approverId" : "user_1007",
    "action" : "驳回",
    "comment" : "申请表中数据用途填写模糊，无法评估风险，建议细化后重提。",
    "createdAt" : "2026-05-02 09:10:35"
  }, {
    "id" : "approvalrecord_1014",
    "bizType" : "授权申请",
    "bizId" : "AUTH-20260510-003",
    "approverId" : "user_1006",
    "action" : "通过",
    "comment" : "合规审查通过，数据访问范围仅限生产报表，同意授权。",
    "createdAt" : "2026-05-07 17:25:48"
  }, {
    "id" : "approvalrecord_1015",
    "bizType" : "授权申请",
    "bizId" : "AUTH-20260515-004",
    "approverId" : "user_1000",
    "action" : "驳回",
    "comment" : "申请者部门非目标数据所属领域，需提供跨部门协作证明。",
    "createdAt" : "2026-05-12 11:50:00"
  }, {
    "id" : "approvalrecord_1016",
    "bizType" : "授权申请",
    "bizId" : "AUTH-20260520-005",
    "approverId" : "user_1000",
    "action" : "通过",
    "comment" : "数据脱敏策略已签署，最小化授权原则满足要求，同意。",
    "createdAt" : "2026-05-17 14:00:20"
  }, {
    "id" : "approvalrecord_1017",
    "bizType" : "授权申请",
    "bizId" : "AUTH-20260525-006",
    "approverId" : "user_1004",
    "action" : "驳回",
    "comment" : "授权有效期过长（两年），按制度最长一年，请调整。",
    "createdAt" : "2026-05-22 08:30:10"
  }, {
    "id" : "approvalrecord_1018",
    "bizType" : "资产发布",
    "bizId" : "ASSET-2026-003",
    "approverId" : "user_1001",
    "action" : "通过",
    "comment" : "新上线客户行为分析数据集，包含用户点击流与转化漏斗数据，数据质量通过校验，同意发布。",
    "createdAt" : "2026-03-01 09:30:00"
  }, {
    "id" : "approvalrecord_1019",
    "bizType" : "资产发布",
    "bizId" : "ASSET-2026-007",
    "approverId" : "user_1005",
    "action" : "驳回",
    "comment" : "提交的资产目录元数据不完整，缺少数据字典和字段级血缘关系，要求补充后重新提交。",
    "createdAt" : "2026-03-10 14:15:00"
  }, {
    "id" : "approvalrecord_1020",
    "bizType" : "资产发布",
    "bizId" : "ASSET-2026-012",
    "approverId" : "user_1003",
    "action" : "通过",
    "comment" : "公司2025年度财务汇总数据表，已完成脱敏处理，符合数据安全规范，准予发布。",
    "createdAt" : "2026-03-20 11:00:00"
  }, {
    "id" : "approvalrecord_1021",
    "bizType" : "API发布",
    "bizId" : "API-2026-005",
    "approverId" : "user_1007",
    "action" : "通过",
    "comment" : "订单查询API v2.0版本，新增批量查询和模糊匹配功能，压力测试通过，同意上线。",
    "createdAt" : "2026-04-01 16:45:00"
  }, {
    "id" : "approvalrecord_1022",
    "bizType" : "API发布",
    "bizId" : "API-2026-009",
    "approverId" : "user_1006",
    "action" : "通过",
    "comment" : "用户画像API接口，支持实时查询标签信息，文档齐全，性能达标，批准发布。",
    "createdAt" : "2026-04-10 08:20:00"
  }, {
    "id" : "approvalrecord_1023",
    "bizType" : "API发布",
    "bizId" : "API-2026-014",
    "approverId" : "user_1006",
    "action" : "驳回",
    "comment" : "API安全认证方案尚未评审，未配置OAuth2.0鉴权，存在安全风险，暂不通过。",
    "createdAt" : "2026-04-20 10:30:00"
  }, {
    "id" : "approvalrecord_1024",
    "bizType" : "授权申请",
    "bizId" : "AUTH-2026-002",
    "approverId" : "user_1006",
    "action" : "通过",
    "comment" : "市场部申请访问客户投诉数据集用于满意度分析，权限范围合理，申请通过。",
    "createdAt" : "2026-05-01 13:00:00"
  }, {
    "id" : "approvalrecord_1025",
    "bizType" : "授权申请",
    "bizId" : "AUTH-2026-006",
    "approverId" : "user_1001",
    "action" : "通过",
    "comment" : "研发部申请临时权限用于数据质量稽核项目，限时30天，已审批通过。",
    "createdAt" : "2026-05-10 15:30:00"
  }, {
    "id" : "approvalrecord_1026",
    "bizType" : "授权申请",
    "bizId" : "AUTH-2026-011",
    "approverId" : "user_1006",
    "action" : "驳回",
    "comment" : "申请人对数据资产的数据权限超出岗位职责范围，且缺少直属上级的签字确认，驳回此申请。",
    "createdAt" : "2026-05-20 09:45:00"
  } ],
  "sheji-dashboardConfig" : [ {
    "id" : "dashboardconfig_1000",
    "userId" : "user_1001",
    "cardType" : "资产总量",
    "position" : 1,
    "timeRange" : "本月",
    "settings" : {
      "title" : "总资产概览",
      "showChart" : true,
      "chartType" : "bar",
      "dataSource" : "asset_summary"
    }
  }, {
    "id" : "dashboardconfig_1001",
    "userId" : "user_1001",
    "cardType" : "增长率",
    "position" : 2,
    "timeRange" : "本年",
    "settings" : {
      "title" : "月增长率趋势",
      "showChart" : true,
      "chartType" : "line",
      "dataSource" : "growth_monthly"
    }
  }, {
    "id" : "dashboardconfig_1002",
    "userId" : "user_1006",
    "cardType" : "质量评分",
    "position" : 3,
    "timeRange" : "今日",
    "settings" : {
      "title" : "今日质量评分",
      "showChart" : false,
      "scoreThreshold" : 85
    }
  }, {
    "id" : "dashboardconfig_1003",
    "userId" : "user_1001",
    "cardType" : "任务成功率",
    "position" : 4,
    "timeRange" : "本周",
    "settings" : {
      "title" : "任务成功率",
      "showChart" : true,
      "chartType" : "pie",
      "dataSource" : "task_success"
    }
  }, {
    "id" : "dashboardconfig_1004",
    "userId" : "user_1003",
    "cardType" : "服务调用趋势",
    "position" : 5,
    "timeRange" : "本月",
    "settings" : {
      "title" : "服务调用量",
      "showChart" : true,
      "chartType" : "area",
      "dataSource" : "api_call_hourly"
    }
  }, {
    "id" : "dashboardconfig_1005",
    "userId" : "user_1002",
    "cardType" : "资产总量",
    "position" : 6,
    "timeRange" : "本年",
    "settings" : {
      "title" : "资产分类分布",
      "showChart" : true,
      "chartType" : "doughnut",
      "dataSource" : "asset_category"
    }
  }, {
    "id" : "dashboardconfig_1006",
    "userId" : "user_1001",
    "cardType" : "增长率",
    "position" : 7,
    "timeRange" : "今日",
    "settings" : {
      "title" : "日环比增长率",
      "showChart" : true,
      "chartType" : "indicator",
      "format" : "percent"
    }
  }, {
    "id" : "dashboardconfig_1007",
    "userId" : "user_1007",
    "cardType" : "质量评分",
    "position" : 8,
    "timeRange" : "本周",
    "settings" : {
      "title" : "部门质量排名",
      "showChart" : true,
      "chartType" : "table",
      "columns" : [ "部门", "得分", "等级" ]
    }
  }, {
    "id" : "dashboardconfig_1008",
    "userId" : "user_1007",
    "cardType" : "任务成功率",
    "position" : 9,
    "timeRange" : "本月",
    "settings" : {
      "title" : "任务失败原因分布",
      "showChart" : true,
      "chartType" : "pie",
      "dataSource" : "error_type"
    }
  } ],
  "sheji-exportRecord" : [ {
    "id" : "exportrecord_1000",
    "userId" : "user_1003",
    "module" : "数据资产",
    "fileName" : "数据资产目录_20260302.xlsx",
    "fileSize" : 204800,
    "status" : "完成",
    "createdAt" : "2026-03-02 10:15:00"
  }, {
    "id" : "exportrecord_1001",
    "userId" : "user_1000",
    "module" : "数据资产",
    "fileName" : "数据资产月度报告_20260410.xlsx",
    "fileSize" : 512000,
    "status" : "生成中",
    "createdAt" : "2026-04-10 14:30:00"
  }, {
    "id" : "exportrecord_1002",
    "userId" : "user_1007",
    "module" : "数据资产",
    "fileName" : "数据资产快照_20260520.xlsx",
    "fileSize" : 1048576,
    "status" : "失败",
    "createdAt" : "2026-05-20 09:00:00"
  }, {
    "id" : "exportrecord_1003",
    "userId" : "user_1004",
    "module" : "数据开发",
    "fileName" : "数据开发脚本导出_20260315.sql",
    "fileSize" : 3145728,
    "status" : "完成",
    "createdAt" : "2026-03-15 11:45:00"
  }, {
    "id" : "exportrecord_1004",
    "userId" : "user_1000",
    "module" : "数据开发",
    "fileName" : "数据开发任务配置_20260422.json",
    "fileSize" : 2097152,
    "status" : "生成中",
    "createdAt" : "2026-04-22 16:20:00"
  }, {
    "id" : "exportrecord_1005",
    "userId" : "user_1006",
    "module" : "数据开发",
    "fileName" : "数据开发日志_20260505.csv",
    "fileSize" : 614400,
    "status" : "失败",
    "createdAt" : "2026-05-05 08:10:00"
  }, {
    "id" : "exportrecord_1006",
    "userId" : "user_1003",
    "module" : "数据质量",
    "fileName" : "数据质量检查结果_20260328.xlsx",
    "fileSize" : 512000,
    "status" : "完成",
    "createdAt" : "2026-03-28 13:55:00"
  }, {
    "id" : "exportrecord_1007",
    "userId" : "user_1001",
    "module" : "数据质量",
    "fileName" : "数据质量规则集_20260418.csv",
    "fileSize" : 1024000,
    "status" : "生成中",
    "createdAt" : "2026-04-18 17:40:00"
  }, {
    "id" : "exportrecord_1008",
    "userId" : "user_1003",
    "module" : "数据质量",
    "fileName" : "数据质量报告_20260512.pdf",
    "fileSize" : 256000,
    "status" : "失败",
    "createdAt" : "2026-05-12 09:25:00"
  }, {
    "id" : "exportrecord_1009",
    "userId" : "user_1004",
    "module" : "数据安全",
    "fileName" : "数据安全审计日志_20260310.csv",
    "fileSize" : 7340032,
    "status" : "完成",
    "createdAt" : "2026-03-10 15:10:00"
  }, {
    "id" : "exportrecord_1010",
    "userId" : "user_1003",
    "module" : "数据安全",
    "fileName" : "数据安全策略导出_20260405.json",
    "fileSize" : 4194304,
    "status" : "生成中",
    "createdAt" : "2026-04-05 11:00:00"
  }, {
    "id" : "exportrecord_1011",
    "userId" : "user_1004",
    "module" : "数据安全",
    "fileName" : "数据安全事件报告_20260525.xlsx",
    "fileSize" : 1536000,
    "status" : "失败",
    "createdAt" : "2026-05-25 16:30:00"
  }, {
    "id" : "exportrecord_1012",
    "userId" : "user_1006",
    "module" : "数据标准",
    "fileName" : "数据标准字典_v3.0.xlsx",
    "fileSize" : 20971520,
    "status" : "完成",
    "createdAt" : "2026-03-20 08:50:00"
  }, {
    "id" : "exportrecord_1013",
    "userId" : "user_1003",
    "module" : "数据标准",
    "fileName" : "数据标准对照表_20260428.csv",
    "fileSize" : 5242880,
    "status" : "生成中",
    "createdAt" : "2026-04-28 19:00:00"
  }, {
    "id" : "exportrecord_1014",
    "userId" : "user_1003",
    "module" : "数据标准",
    "fileName" : "数据标准变更记录_20260515.xlsx",
    "fileSize" : 819200,
    "status" : "失败",
    "createdAt" : "2026-05-15 12:10:00"
  }, {
    "id" : "exportrecord_1015",
    "userId" : "user_1005",
    "module" : "数据服务",
    "fileName" : "数据服务API文档_20260305.pdf",
    "fileSize" : 10485760,
    "status" : "完成",
    "createdAt" : "2026-03-05 14:25:00"
  }, {
    "id" : "exportrecord_1016",
    "userId" : "user_1002",
    "module" : "数据服务",
    "fileName" : "数据服务调用统计_20260415.xlsx",
    "fileSize" : 307200,
    "status" : "生成中",
    "createdAt" : "2026-04-15 10:30:00"
  }, {
    "id" : "exportrecord_1017",
    "userId" : "user_1001",
    "module" : "数据服务",
    "fileName" : "数据服务配置备份_20260501.json",
    "fileSize" : 1587200,
    "status" : "失败",
    "createdAt" : "2026-05-01 17:00:00"
  }, {
    "id" : "exportrecord_1018",
    "userId" : "user_1003",
    "module" : "数据资产",
    "fileName" : "数据资产目录导出_20260401.xlsx",
    "fileSize" : 4523000,
    "status" : "完成",
    "createdAt" : "2026-04-01 09:15:00"
  }, {
    "id" : "exportrecord_1019",
    "userId" : "user_1003",
    "module" : "数据质量",
    "fileName" : "数据质量规则校验结果_20260518.csv",
    "fileSize" : 1250,
    "status" : "失败",
    "createdAt" : "2026-05-18 16:42:30"
  } ]
}

// 各 storageKey 对应的 store 内 stateName（与 stores 中的 ref 名严格一致）
const STATE_NAME_MAP = {
  "sheji-user" : "userList",
  "sheji-dataAsset" : "dataAssetList",
  "sheji-dataAssetField" : "dataAssetFieldList",
  "sheji-dataAssetFavorite" : "favoriteList",
  "sheji-qualityRule" : "qualityRuleList",
  "sheji-detectionResult" : "detectionResultList",
  "sheji-dataStandard" : "dataStandardList",
  "sheji-integrationPlan" : "integrationPlanList",
  "sheji-executionLog" : "executionLogList",
  "sheji-apiDefinition" : "apiDefinitionList",
  "sheji-grantApplication" : "grantApplicationList",
  "sheji-approvalRecord" : "approvalRecordList",
  "sheji-dashboardConfig" : "dashboardConfigList",
  "sheji-exportRecord" : "exportRecordList"
}

export function seedIfEmpty() {
  for (const [key, value] of Object.entries(SEED)) {
    if (!localStorage.getItem(key)) {
      const stateName = STATE_NAME_MAP[key]
      if (!stateName) continue
      // pinia-plugin-persistedstate 默认整个 state 序列化为对象
      localStorage.setItem(key, JSON.stringify({ [stateName]: value }))
    }
  }
}
