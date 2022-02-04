const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const TextSchema = new mongoose.Schema({
  versions: {
    ar: String,
    en: String,
    fr: String,
  },
  state: String,
});

TextSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Text", TextSchema);
