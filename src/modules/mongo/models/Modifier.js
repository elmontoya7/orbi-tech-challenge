// libraries
const { Schema, model } = require('mongoose');

const schema = new Schema({
  name: {
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
  }
}, 
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Model = model("Modifier", schema);
module.exports = Model;

// const modifier = 
// {
//   id: '',
//   name: '',
//   price: 0,
//   available: true
// }