/*
 * @Author: FirstsnowLucky firstsnow1119@163.com
 * @Date: 2025-05-28 10:32:42
 * @LastEditors: FirstsnowLucky firstsnow1119@163.com
 * @LastEditTime: 2025-05-28 12:18:35
 * @FilePath: \demo-gen-item\src\utils\request.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios'
const baseURL = '/api';

const request = axios.create({ baseURL })

request.interceptors.request.use(config => {
    const tokenStore = localStorage.getItem('token')
    if (tokenStore) {
        config.headers['content-type'] = "application/json"
        config.headers.satoken = tokenStore
    }
    if (config.method === 'get' && config.params) {
        let url = config.url + '?';
        for (const propName of Object.keys(config.params)) {
            const value = config.params[propName];
            var part = encodeURIComponent(propName) + "=";
            if (value !== null && typeof (value) !== "undefined") {
                if (typeof value === 'object') {
                    for (const key of Object.keys(value)) {
                        let params = propName + '[' + key + ']';
                        var subPart = encodeURIComponent(params) + "=";
                        url += subPart + encodeURIComponent(value[key]) + "&";
                    }
                } else {
                    url += part + encodeURIComponent(value) + "&";
                }
            }
        }
        url = url.slice(0, -1);
        config.params = {};
        config.url = url;
    }
    return config
}, error => {
    console.log(error)
    Promise.reject(error)
})

request.interceptors.response.use(
    result => {
        if (result.status === 200) return result.data;
        return Promise.reject(result.data);
    },
    err => {
        if (err.response.data.code === 401) {
            localStorage.clear()
        }
        const code = err.response.status;
        if (code === 500) return localStorage.clear() && Promise.reject(err);
    }
)

export default request;

