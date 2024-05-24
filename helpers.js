import mongoose from 'mongoose';

const getQueryNotFoundError = (lookingFor) => {
  const err = new Error(`${lookingFor} not found.`);
  err.status = 404;
  return err;
};

const validateObjectId = (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).send(`Invalid ObjectId: ${id}`);
  next();
};

export { getQueryNotFoundError, validateObjectId };
