// libraries
const { Schema, model } = require('mongoose');

const schema = new Schema({
  user: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String
  },
  items: [
    {
      dish: {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'Dish'
        },
        name: String,
        price: Number,
        image: String
      },
      modifiers: [
        {
          id: {
            type: Schema.Types.ObjectId,
            ref: 'Modifier'
          },
          name: String,
          price: Number
        }
      ]
    }
  ],
  total_dishes: {
    type: Number,
    default: 0
  },
  total_modifiers: {
    type: Number,
    default: 0
  },
  tip: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  address: {
    line_1: String,
    line_2: String
  },
  payment: {
    pay_on_delivery: {
      type: Boolean,
      default: false
    },
    card_number: String,
    card_exp_date: String
  },
  status: {
    type: String,
    default: 'preparando'
  }
}, 
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Model = model("Order", schema);
module.exports = Model;

// const order = 
// {
//   id: '',
//   user: {
//     id: '',
//     name: ''
//   },
//   items: [
//     {
//       dish: {
//         id: '',
//         name: '',
//         price: 0,
//         image: ''
//       },
//       modifiers: [
//         {
//           id: '',
//           name: '',
//           price: 0
//         }
//       ]
//     }
//   ],
//   total_dishes: 0,
//   total_modifiers: 0,
//   tip: 0,
//   subtotal: 0,
//   total: 0,
//   address: {
//     line_1: '',
//     line_2: ''
//   },
//   payment: {
//     pay_on_delivery: false,
//     card_number: '',
//     card_exp_date: Date
//   },
//   status: 'preparando'
// }