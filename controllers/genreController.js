import asyncHandler from 'express-async-handler';
import { body, validationResult } from 'express-validator';

import { getQueryNotFoundError } from '../helpers.js';

import Genre from '../models/genre.js';
import Book from '../models/book.js';

const getGenreAndAllBooksInGenre = (genreId, projection = 'title summary') =>
  Promise.all([
    Genre.findById(genreId).exec(),
    Book.find({ genre: genreId }, projection).sort({ title: 1 }).exec(),
  ]).then(([genre, allBooksInGenre]) => ({ genre, allBooksInGenre }));

const genre_controller = {
  // Display list of all Genre.
  genre_list: asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find().sort({ name: 1 }).exec();
    res.render('genre_list', {
      title: 'Genre List',
      genre_list: allGenres,
    });
  }),
  // Display detail page for a specific Genre.
  genre_detail: asyncHandler(async (req, res, next) => {
    const { genre, allBooksInGenre } = await getGenreAndAllBooksInGenre(req.params.id);
    if (genre === null) return next(getQueryNotFoundError('Genre'));
    res.render('genre_detail', {
      title: 'Genre Detail',
      genre: genre,
      genre_books: allBooksInGenre,
    });
  }),
  // Display Genre create form on GET.
  genre_create_get: (req, res, next) => {
    res.render('genre_form', { title: 'Create Genre' });
  },
  // Handle Genre create on POST.
  genre_create_post: [
    // Validate and sanitize the name field
    body('name', 'Genre name must contain at least 3 characters')
      .trim()
      .isLength({ min: 3 })
      .escape(),
    asyncHandler(async (req, res, next) => {
      // Extract the validation errors from a request
      const errors = validationResult(req);
      // Create a genre object with escaped and trimmed data
      const genre = new Genre({ name: req.body.name });
      if (!errors.isEmpty()) {
        res.render('genre_form', {
          title: 'Create Genre',
          genre,
          errors: errors.array(),
        });
        return;
      } else {
        // Data form is valid
        // Check if Genre with same name already exists
        const genreExists = await Genre.findOne({ name: req.body.name })
          .collation({ locale: 'en', strength: 2 })
          .exec();
        if (genreExists) res.redirect(genreExists.url);
        else {
          await genre.save();
          res.redirect(genre.url);
        }
      }
    }),
  ],
  // Display Genre delete form on GET.
  genre_delete_get: asyncHandler(async (req, res, next) => {
    const { genre, allBooksInGenre } = await getGenreAndAllBooksInGenre(req.params.id);
    if (genre === null) {
      res.redirect('/catalog/genres');
      return;
    }
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre,
      genre_books: allBooksInGenre,
    });
  }),
  // Handle Genre delete on POST.
  genre_delete_post: asyncHandler(async (req, res, next) => {
    const { genre, allBooksInGenre } = await getGenreAndAllBooksInGenre(req.params.id);
    if (allBooksInGenre.length <= 0) {
      await Genre.findByIdAndDelete(req.body.genreid);
      res.redirect('/catalog/genres');
      return;
    }
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre,
      genre_books: allBooksInGenre,
    });
  }),
  // Display Genre update form on GET.
  genre_update_get: asyncHandler(async (req, res, next) => {
    const genre = await Genre.findById(req.params.id).exec();
    if (genre === null) return next(getQueryNotFoundError('Genre'));
    res.render('genre_form', {
      title: 'Update Genre',
      genre,
    });
  }),
  // Handle Genre update on POST.
  genre_update_post: [
    body('name', 'Invalid genre').trim().isLength({ min: 1 }).escape(),
    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);
      const genre = new Genre({ name: req.body.name, _id: req.params.id });
      if (!errors.isEmpty()) {
        res.render('genre_form', { title: 'Update Genre', genre, errors: errors.array() });
        return;
      }
      const updateGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
      res.redirect(updateGenre.url);
    }),
  ],
};

export default genre_controller;
