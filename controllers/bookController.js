import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

import { getQueryNotFoundError } from '../helpers.js';

import Book from '../models/book.js';
import Author from '../models/author.js';
import Genre from '../models/genre.js';
import BookInstance from '../models/bookinstance.js';

const book_controller = {
  index: asyncHandler(async (req, res, next) => {
    const [numBooks, numBookInstances, numAvailableBookInstances, numAuthors, numGenres] =
      await Promise.all([
        Book.countDocuments({}).exec(),
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({ status: 'Available' }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec(),
      ]);
    res.render('index', {
      title: 'Local Library Home',
      book_count: numBooks,
      book_instance_count: numBookInstances,
      book_instance_available_count: numAvailableBookInstances,
      author_count: numAuthors,
      genre_count: numGenres,
    });
  }),
  // Display list of all books.
  book_list: asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title author')
      .sort({ title: 1 })
      .populate('author')
      .exec();
    res.render('book_list', { title: 'Book List', book_list: allBooks });
  }),
  // Display detail page for a specific book.
  book_detail: asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
      Book.findById(req.params.id).populate('author').populate('genre').exec(),
      BookInstance.find({ book: req.params.id }).exec(),
    ]);
    if (book === null) return next(getQueryNotFoundError('Book'));
    res.render('book_detail', {
      title: book.title,
      book: book,
      book_instances: bookInstances,
    });
  }),
  // Display book create form on GET.
  book_create_get: asyncHandler(async (req, res, next) => {
    // Get all authors and genres, which we can use for adding to our book
    const [allAuthors, allGenres] = await Promise.all([
      Author.find().sort({ family_name: 1 }).exec(),
      Genre.find().sort({ name: 1 }).exec(),
    ]);
    res.render('book_form', {
      title: 'Create Book',
      authors: allAuthors,
      genres: allGenres,
    });
  }),
  // Handle book create on POST.
  book_create_post: [
    //  Convert the genre to an array
    (req, res, next) =>
      Array.isArray(req.body.genre)
        ? next()
        : (req.body.genre = typeof req.body.genre === 'undefined' ? [] : [req.body.genre]),
    // Validate and sanitize fields
    body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const { title, author, summary, isbn, genre } = req.body;
      const book = new Book({
        title,
        author,
        summary,
        isbn,
        genre,
      });
      if (!errors.isEmpty()) {
        const [allAuthors, allGenres] = await Promise.all([
          Author.find().sort({ family_name: 1 }).exec(),
          Genre.find().sort({ name: 1 }).exec(),
        ]);
        for (const genre of allGenres) {
          if (book.genre.includes(genre._id)) genre.checked = 'true';
        }
        res.render('book_form', {
          title: 'Create Book',
          authors: allAuthors,
          genres: allGenres,
          book,
          errors: errors.array(),
        });
      } else {
        await book.save();
        res.redirect(book.url);
      }
    }),
  ],
  // Display book delete form on GET.
  book_delete_get: asyncHandler(async (req, res, next) => {
    const [book, allBookInstances] = await Promise.all([
      Book.findById(req.params.id).exec(),
      BookInstance.find({ book: req.params.id }, 'imprint status').exec(),
    ]);
    if (book === null) res.redirect('/catalog/books');
    res.render('book_delete', {
      title: 'Delete Book',
      book,
      book_instances: allBookInstances,
    });
  }),
  // Handle book delete on POST.
  book_delete_post: asyncHandler(async (req, res, next) => {
    const [book, allBookInstances] = await Promise.all([
      Book.findById(req.params.id).exec(),
      BookInstance.find({ book: req.params.id }, 'imprint status').exec(),
    ]);
    if (allBookInstances.length <= 0) {
      await Book.findByIdAndDelete(req.params.id);
      res.redirect('/catalog/books');
    } else {
      res.render('book_delete', {
        title: 'Delete Book',
        book,
        book_instances: allBookInstances,
      });
    }
  }),
  // Display book update form on GET.
  book_update_get: asyncHandler(async (req, res, next) => {
    const [book, allAuthors, allGenres] = await Promise.all([
      Book.findById(req.params.id).populate('author').exec(),
      Author.find().sort({ family_name: 1 }).exec(),
      Genre.find().sort({ name: 1 }).exec(),
    ]);
    if (book === null) next(getQueryNotFoundError('Book'));
    allGenres.forEach((genre) => {
      if (book.genre.includes(genre._id)) genre.checked = 'true';
    });
    res.render('book_form', {
      title: 'Update Book',
      authors: allAuthors,
      genres: allGenres,
      book,
    });
  }),
  // Handle book update on POST.
  book_update_post: [
    (req, res, next) => {
      const genre = req.body.genre;
      if (!Array.isArray(genre)) req.body.genre = typeof genre === 'undefined' ? [] : [genre];
      next();
    },
    body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const { title, author, summary, isbn, genre } = req.body;
      const book = new Book({
        title,
        author,
        summary,
        isbn,
        genre: typeof genre === 'undefined' ? [] : genre,
        _id: req.params.id,
      });

      if (!errors.isEmpty()) {
        const [allAuthors, allGenres] = await Promise.all([
          Author.find().sort({ family_name: 1 }).exec(),
          Genre.find().sort({ name: 1 }).exec(),
        ]);
        for (const genre of allGenres) {
          if (bookData.genre.includes(genre._id)) genre.checked = 'true';
        }
        res.render('book_form', {
          title: 'Update Book',
          authors: allAuthors,
          genres: allGenres,
          book,
          errors: errors.array(),
        });
        return;
      } else {
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
        res.redirect(updatedBook.url);
      }
    }),
  ],
};

export default book_controller;
