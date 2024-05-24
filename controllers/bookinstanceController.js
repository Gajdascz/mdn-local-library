import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

import BookInstance from '../models/bookinstance.js';
import Book from '../models/book.js';
import bookinstance from '../models/bookinstance.js';
import { getQueryNotFoundError } from '../helpers.js';

const book_instance_controller = {
  // Display list of all BookInstances.
  bookinstance_list: asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate('book').exec();
    res.render('bookinstance_list', {
      title: 'Book Instance List',
      bookinstance_list: allBookInstances,
    });
  }),
  // Display detail page for a specific BookInstance.
  bookinstance_detail: asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate('book').exec();
    if (bookInstance === null) return next(getQueryNotFoundError('Book Instance'));
    res.render('bookinstance_detail', {
      title: 'Book:',
      bookinstance: bookInstance,
    });
  }),
  // Display BookInstance create form on GET.
  bookinstance_create_get: asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();
    res.render('bookinstance_form', {
      title: 'Create BookInstance',
      book_list: allBooks,
    });
  }),
  // Handle BookInstance create on POST.
  bookinstance_create_post: [
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ values: 'falsy' }).isISO8601().toDate(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const { book, imprint, status, due_back } = req.body;
      const bookInstance = new BookInstance({
        book,
        imprint,
        status,
        due_back,
      });
      if (!errors.isEmpty()) {
        const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();
        res.render('bookinstance_form', {
          title: 'Create BookInstance',
          book_list: allBooks,
          selected_book: bookInstance.book._id,
          errors: errors.array(),
          bookinstance: bookInstance,
        });
        return;
      }
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }),
  ],
  // Display BookInstance delete form on GET.
  bookinstance_delete_get: asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).exec();
    if (bookInstance === null) {
      res.redirect('/catalog/bookinstances');
      return;
    }
    res.render('bookinstance_delete', {
      title: 'Delete Book Instance',
      bookinstance,
    });
  }),
  // Handle BookInstance delete on POST.
  bookinstance_delete_post: asyncHandler(async (req, res, next) => {
    await BookInstance.findByIdAndDelete(req.params.id);
    res.redirect('/catalog/bookinstances');
  }),
  // Display BookInstance update form on GET.
  bookinstance_update_get: asyncHandler(async (req, res, next) => {
    const [bookInstance, allBooks] = await Promise.all([
      BookInstance.findById(req.params.id).exec(),
      Book.find({}, 'title').sort({ title: 1 }).exec(),
    ]);
    if (bookInstance === null) return next(getQueryNotFoundError('Book Instance'));
    res.render('bookinstance_form', {
      title: 'Update Book Instance',
      bookinstance: bookInstance,
      book_list: allBooks,
      selected_book: bookInstance.book._id,
    });
  }),
  // Handle bookinstance update on POST.
  bookinstance_update_post: [
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ values: 'falsy' }).isISO8601().toDate(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const { book, imprint, status, due_back } = req.body;
      const bookInstance = new BookInstance({
        book,
        imprint,
        status,
        due_back,
        _id: req.params.id,
      });
      if (!errors.isEmpty()) {
        const allBooks = await Book.find({}, 'title').sort({ title: 1 }).exec();
        res.render('bookinstance_form', {
          title: 'Update Book Instance',
          bookinstance: bookInstance,
          book_list: allBooks,
          selected_book: bookInstance.book._id,
          errors: errors.array(),
        });
        return;
      }
      const updatedBookInstance = await BookInstance.findByIdAndUpdate(
        req.params.id,
        bookInstance,
        {}
      );
      res.redirect(updatedBookInstance.url);
    }),
  ],
};

export default book_instance_controller;
