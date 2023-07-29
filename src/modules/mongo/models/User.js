// libraries
const { Schema, model } = require('mongoose');

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  blocked: {
    type: Boolean,
    default: false
  }
}, 
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Model = model("User", schema);
module.exports = Model;

// const user = 
// {
//   id: '',
//   name: '',
//   email: '',
//   password: '',
//   blocked: false
// }