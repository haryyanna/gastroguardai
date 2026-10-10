export const json = (res, statusCode, payload) => {
  res.status(statusCode).json(payload);
};
