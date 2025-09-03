import http from './http';


export const listPosts = (params) => http.get('/api/posts', { params });
export const getPost = (id) => http.get(`/api/posts/${id}`);
export const createPost = (formData) => http.post('/api/posts', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
export const updatePost = (id, formData) => http.put(`/api/posts/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
export const deletePost = (id) => http.delete(`/api/posts/${id}`);