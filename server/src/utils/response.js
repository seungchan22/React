export const ok = (res, data) => res.json(data);
export const fail = (res, tag, err, code = 500) => {
  const detail = (err && (err.sqlMessage || err.message)) || String(err);
  console.error(`[${tag}]`, detail);
  return res.status(code).json({ error: tag, detail });
};
