import api from "@/utils/request.js";

/**
 * 创建桥梁荷载模拟分析
 * @param {Object} params - 包含bridge_id, user_id, simulation_type, parameters的请求参数
 * @returns {code: 200, msg: 'success', data: {simulation: {id: number, bridge_id: number, user_id: number, simulation_type: string, parameters: string, created_at: string, updated_at: string}}}
 */
export const createSimulationApi = (params) => api.post(`/api/simulations`, params)

/**
 * 获取单个模拟分析结果
 * @param {number} id - 模拟分析ID
 * @returns {code: 200, msg: 'success', data: {simulation: {id: number, bridge_id: number, user_id: number, simulation_type: string, parameters: string, created_at: string, updated_at: string}}}
 */
export const getSimulationApi = (id) => api.get(`/api/simulations/${id}`)

/**
 * 获取桥梁所有模拟记录
 * @param {number} id - 桥梁ID
 * @returns {code: 200, msg: 'success', data: {simulations: [{id: number, bridge_id: number, user_id: number, simulation_type: string, parameters: string, created_at: string, updated_at: string}]}}
 */
export const getBridgeSimulationsApi = (id) => api.get(`/api/simulations/bridge/${id}`)
/**
 * 用户注册
 * @param {Object} params - 注册信息
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 * @param {string} params.email - 邮箱
 * @param {string} [params.role] - 角色(ADMIN/USER/WORKER)
 * @returns {code: 200, msg: 'success', data: {user: Object, token: string}}
 */
export const registerApi = (params) => api.post(`/api/auth/register`, params)

/**
 * 用户登录
 * @param {Object} params - 登录信息
 * @param {string} params.email - 邮箱
 * @param {string} params.password - 密码
 * @returns {code: 200, msg: 'success', data: {user: Object, token: string}}
 */
export const loginApi = (params) => api.post(`/api/auth/login`, params)

/**
 * 获取用户信息
 * @returns {code: 200, msg: 'success', data: {user: Object}}
 */
export const getProfileApi = () => api.get(`/api/users/profile`)

/**
 * 更新用户信息
 * @param {Object} params - 更新信息
 * @param {string} [params.username] - 用户名
 * @param {string} [params.password] - 密码
 * @param {string} [params.email] - 邮箱
 * @param {string} [params.role] - 角色(ADMIN/USER/WORKER)
 * @returns {code: 200, msg: 'success', data: {user: Object}}
 */
export const updateProfileApi = (params) => api.put(`/api/users/profile`, params)
/**
 * 获取所有系统日志
 * @returns {code: 200, msg: 'success', data: {logs: [...]}}
 */
export const getAllLogsApi = () => api.get('/systemlogs')

/**
 * 获取指定系统日志
 * @param id
 * @returns {code: 200, msg: 'success', data: {log: {...}}} | {code: 404, msg: 'not found'}
 */
export const getLogApi = (id) => api.get(`/systemlogs/${id}`)

/**
 * 创建系统日志
 * @param params {user_id: number, action: string, description?: string, ip_address: string}
 * @returns {code: 200, msg: 'success', data: {log: {...}}}
 */
export const createLogApi = (params) => api.post('/systemlogs', params)

/**
 * 删除系统日志
 * @param id
 * @returns {code: 200, msg: 'success', data: {message: 'Log deleted successfully'}} | {code: 404, msg: 'not found'}
 */
export const deleteLogApi = (id) => api.delete(`/systemlogs/${id}`)
/**
 * 创建安全评估
 * @param {Object} params - 包含bridge_id, simulation_id, safety_level, risk_factors, recommendations
 * @returns {code: 200, msg: 'success', data: {assessment: Object}}
 */
export const createAssessmentApi = (params) => api.post(`/api/assessments`, params)

/**
 * 获取评估详情
 * @param {Number} id - 评估ID
 * @returns {code: 200, msg: 'success', data: {assessment: Object}}
 */
export const getAssessmentApi = (id) => api.get(`/api/assessments/${id}`)

/**
 * 获取桥梁所有评估记录
 * @param {Number} id - 桥梁ID
 * @returns {code: 200, msg: 'success', data: {assessments: Array}}
 */
export const getBridgeAssessmentsApi = (id) => api.get(`/api/assessments/bridge/${id}`)

/**
 * 生成评估报告
 * @param {Object} params - 包含assessment_id, report_format(可选)
 * @returns {code: 200, msg: 'success', data: {message: String, file_name: String, download_url: String}}
 */
export const generateReportApi = (params) => api.post(`/api/assessments/report`, params)
/**
 * 获取桥梁列表
 * @returns {code: 200, msg: 'success', data: {bridges: Array}}
 */
export const getBridgesApi = () => api.get(`/api/bridges`)

/**
 * 创建桥梁记录
 * @param params {name: string, location: string, build_year: number, length: number, width: number, structure_type: '梁桥'|'拱桥'|'斜拉桥'|'悬索桥'|'组合桥', status?: '正常'|'维修中'|'已废弃'|'建设中'}
 * @returns {code: 200, msg: 'success', data: {bridge: Object}}
 */
export const postBridgesApi = (params) => api.post(`/api/bridges`, params)

/**
 * 获取单个桥梁详情
 * @param id 桥梁ID
 * @returns {code: 200, msg: 'success', data: {bridge: Object}}
 */
export const getBridgeDetailApi = (id) => api.get(`/api/bridges/${id}`)

/**
 * 更新桥梁信息
 * @param id 桥梁ID
 * @param params {name?: string, location?: string, build_year?: number, length?: number, width?: number, structure_type?: '梁桥'|'拱桥'|'斜拉桥'|'悬索桥'|'组合桥', status?: '正常'|'维修中'|'已废弃'|'建设中'}
 * @returns {code: 200, msg: 'success', data: {bridge: Object}}
 */
export const putBridgeApi = (id, params) => api.put(`/api/bridges/${id}`, params)

/**
 * 删除桥梁记录
 * @param id 桥梁ID
 * @returns {code: 200, msg: 'success', data: {message: string}}
 */
export const deleteBridgeApi = (id) => api.delete(`/api/bridges/${id}`)
