import e from 'express';
import mongoose from 'mongoose';
import createHttpError from 'http-errors';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import catalogRouter from './routes/catalog.js';
import compression from 'compression';
import helmet from 'helmet';
import RateLimit from 'express-rate-limit';
import { configDotenv } from 'dotenv';
configDotenv();
mongoose.set('strictQuery', false);

const app = e();
const __dirname = import.meta.dirname;

const limiter = RateLimit({
  max: 20,
});
app.use(compression());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
    },
  })
);
app.use(limiter);

const main = async () => await mongoose.connect(process.env.MONGODB_URI);
main().catch((err) => console.log(err));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(morgan('dev'));
app.use(e.json());
app.use(e.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(e.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createHttpError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
