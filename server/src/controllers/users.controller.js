import * as svc from '../services/users.service.js';
import { ok } from '../utils/response.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const data = await svc.list(req.query);
  ok(res, data);
});

export const create = asyncHandler(async (req, res) => {
  const id = await svc.create(req.body);
  ok(res, { id });
});

export const update = asyncHandler(async (req, res) => {
  await svc.update(Number(req.params.id), req.body);
  ok(res, { success: true });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await svc.resetPassword(Number(req.params.id), req.body.password);
  ok(res, { success: true });
});
