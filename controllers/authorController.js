import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';
import Debug from 'debug';

import { getQueryNotFoundError } from '../helpers.js';
import Author from '../models/author.js';
import Book from '../models/book.js';

const debug = Debug('author');

const getAuthorAndAllBooksByAuthor = (authorId, projection = 'title summary') =>
  Promise.all([
    Author.findById(authorId).exec(),
    Book.find({ author: authorId }, projection).sort({ title: 1 }).exec(),
  ]).then(([author, allBooksByAuthor]) => ({ author, allBooksByAuthor }));

const author_controller = {
  // Display list of all Authors
  author_list: asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
    debug(`fetching author list from db`);
    res.render('author_list', {
      title: 'Author List',
      author_list: allAuthors,
    });
  }),
  // Display detail page for a specific Author
  author_detail: asyncHandler(async (req, res, next) => {
    const { author, allBooksByAuthor } = await getAuthorAndAllBooksByAuthor(req.params.id);
    if (author === null) {
      debug(`not found on detail GET request: ${req.params.id}`);
      return next(getQueryNotFoundError('Author'));
    }
    res.render('author_detail', {
      title: 'Author Detail',
      author: author,
      author_books: allBooksByAuthor,
    });
  }),
  // Display Author create form on GET
  author_create_get: (req, res, next) => {
    res.render('author_form', { title: 'Create Author' });
  },
  // Handle Author create on POST
  author_create_post: [
    // Validate and sanitize fields
    body('first_name')
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage('First name must be specified.')
      .isAlphanumeric()
      .withMessage('First name has non-alphanumeric characters.'),
    body('family_name')
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage('Family name must be specified')
      .isAlphanumeric()
      .withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth')
      .optional({ values: 'falsy' })
      .isISO8601()
      .toDate(),
    body('date_of_death', 'Invalid date of death')
      .optional({ values: 'falsy' })
      .isISO8601()
      .toDate(),
    // Process request after validation and sanitization
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create Author object with escaped and trimmed data
      const { first_name, family_name, date_of_birth, date_of_death } = req.body;
      const author = new Author({
        first_name,
        family_name,
        date_of_birth,
        date_of_death,
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.
        res.render('author_form', {
          title: 'Create Author',
          author,
          errors: errors.array(),
        });
        return;
      }
      // Data from form is valid
      // Save author
      await author.save();
      // Redirect to new author record
      res.redirect(author.url);
    }),
  ],
  // Display author delete form on GET
  author_delete_get: asyncHandler(async (req, res, next) => {
    const { author, allBooksByAuthor } = await getAuthorAndAllBooksByAuthor(req.params.id);
    if (author === null) {
      res.redirect('/catalog/authors');
      return;
    }
    res.render('author_delete', {
      title: 'Delete Author',
      author,
      author_books: allBooksByAuthor,
    });
  }),
  // Handle author delete on POST
  author_delete_post: asyncHandler(async (req, res, next) => {
    const { author, allBooksByAuthor } = await getAuthorAndAllBooksByAuthor(req.params.id);
    if (allBooksByAuthor.length <= 0) {
      await Author.findByIdAndDelete(req.params.id);
      res.redirect('/catalog/authors');
      return;
    }
    res.render('author_delete', {
      title: 'Delete Author',
      author,
      author_books: allBooksByAuthor,
    });
  }),
  // Display author update form on GET
  author_update_get: asyncHandler(async (req, res, next) => {
    const author = await Author.findById(req.params.id).exec();
    if (author === null) {
      debug(`not found on update GET request: ${req.params.id}`);
      return next(getQueryNotFoundError('Author'));
    }
    res.render('author_form', {
      title: 'Update Author',
      author,
    });
  }),
  // Handle author update on POST
  author_update_post: [
    body('first_name', 'First name must not be empty').trim().isLength({ min: 1 }).escape(),
    body('family_name', 'Family name must not be empty').trim().isLength({ min: 1 }).escape(),
    body('date_of_birth', 'Invalid date').optional({ values: 'falsy' }).trim().isISO8601().toDate(),
    body('date_of_death', 'Invalid date').optional({ values: 'falsy' }).trim().isISO8601().toDate(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const { first_name, family_name, date_of_birth, date_of_death } = req.body;
      const author = new Author({
        first_name,
        family_name,
        date_of_birth,
        date_of_death,
        _id: req.params.id,
      });
      if (!errors.isEmpty()) {
        res.render('author_form', { title: 'Update Author', author, errors: errors.array() });
        return;
      }
      const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
      res.redirect(updatedAuthor.url);
    }),
  ],
};
export default author_controller;
