import { http, HttpResponse } from 'msw';

let objects = [];
let tasks = [];
let chatMessages = [];

export const handlers = [
  // Objects
  http.get('*/rest/v1/objects', () => {
    return HttpResponse.json(objects);
  }),
  http.post('*/rest/v1/objects', async ({ request }) => {
    const body = await request.json();
    const payload = Array.isArray(body) ? body[0] : body;
    const record = { id: objects.length + 1, ...payload };
    objects.push(record);
    return HttpResponse.json(record);
  }),
  http.delete('*/rest/v1/objects', ({ request }) => {
    const idParam = new URL(request.url).searchParams.get('id');
    const id = idParam ? Number(idParam.split('eq.')[1]) : null;
    if (id !== null) {
      objects = objects.filter(o => o.id !== id);
    }
    return HttpResponse.json({});
  }),

  // Tasks
  http.get('*/rest/v1/tasks', ({ request }) => {
    const url = new URL(request.url);
    const objectIdParam = url.searchParams.get('object_id');
    const objectId = objectIdParam ? objectIdParam.split('eq.')[1] : null;
    const filtered = objectId ? tasks.filter(t => String(t.object_id) === objectId) : tasks;
    return HttpResponse.json(filtered);
  }),
  http.post('*/rest/v1/tasks', async ({ request }) => {
    const body = await request.json();
    const payload = Array.isArray(body) ? body[0] : body;
    const record = { id: tasks.length + 1, ...payload };
    tasks.push(record);
    return HttpResponse.json(record);
  }),
  http.delete('*/rest/v1/tasks', ({ request }) => {
    const idParam = new URL(request.url).searchParams.get('id');
    const id = idParam ? Number(idParam.split('eq.')[1]) : null;
    if (id !== null) {
      tasks = tasks.filter(t => t.id !== id);
    }
    return HttpResponse.json({});
  }),

  // Chat messages
  http.get('*/rest/v1/chat_messages', ({ request }) => {
    const url = new URL(request.url);
    const objectIdParam = url.searchParams.get('object_id');
    const objectId = objectIdParam ? objectIdParam.split('eq.')[1] : null;
    const filtered = objectId ? chatMessages.filter(m => String(m.object_id) === objectId) : chatMessages;
    return HttpResponse.json(filtered);
  }),
  http.post('*/rest/v1/chat_messages', async ({ request }) => {
    const body = await request.json();
    const payload = Array.isArray(body) ? body[0] : body;
    const record = { id: chatMessages.length + 1, created_at: new Date().toISOString(), ...payload };
    chatMessages.push(record);
    return HttpResponse.json(record);
  }),
  http.delete('*/rest/v1/chat_messages', ({ request }) => {
    const idParam = new URL(request.url).searchParams.get('id');
    const id = idParam ? Number(idParam.split('eq.')[1]) : null;
    if (id !== null) {
      chatMessages = chatMessages.filter(m => m.id !== id);
    }
    return HttpResponse.json({});
  }),

  // Storage upload
  http.post('*/storage/v1/object/*', () => {
    return HttpResponse.json({ Key: 'mocked/path' });
  }),
];
