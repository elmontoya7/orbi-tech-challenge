// libraries
const { Schema, model } = require('mongoose');

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  notes: String,
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  available: {
    type: Boolean,
    default: true
  },
  image: String,
  modifiers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Modifier'
    }
  ]
}, 
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Model = model("Dish", schema);
module.exports = Model;

// const dish = 
// {
//   id: '',
//   name: '',
//   notes: '',
//   category: '',
//   price: 0,
//   available: true,
//   image: '',
//   modifiers: [
//     modifier_id
//   ]
// }