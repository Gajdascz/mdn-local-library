import mongoose from 'mongoose';
import { DateTime } from 'luxon';
const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  family_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

AuthorSchema.virtual('name').get(function () {
  return this.first_name && this.family_name ? `${this.family_name}, ${this.first_name}` : '';
});

AuthorSchema.virtual('url').get(function () {
  return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual('lifespan').get(function () {
  const born = this.date_of_birth
    ? `${DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)}`
    : 'unknown';
  const died = this.date_of_death
    ? `${DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)}`
    : '';
  return born === 'unknown' && died === '' ? '' : `(${born} - ${died})`;
});

AuthorSchema.virtual('date_of_birth_yyyy_mm_dd').get(function () {
  return DateTime.fromJSDate(this.date_of_birth).toISODate();
});

AuthorSchema.virtual('date_of_death_yyyy_mm_dd').get(function () {
  return DateTime.fromJSDate(this.date_of_death).toISODate();
});

export default mongoose.model('Author', AuthorSchema);
