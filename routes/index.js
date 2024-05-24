import e from 'express';

const router = e.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect('/catalog');
});

export default router;
