import request from '../utils/request'

export function register(data) {
  return request.post('/user/register', data)
}

export function login(data) {
  return request.post('/user/login', data)
}

export function getUserList() {
  return request.get('/user/list')
}
