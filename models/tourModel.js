const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'], 
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters '],
        minlength: [10, 'A tour name must have more or equal then 10 characters ']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: "Difficulty is either: easy, medium, difficult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must above 1.0 or equal'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (val) { 
                return val < this.price; 

            },
            message: 'Discout price ({VALUE}) should be bellow regular price'
        }
    },
    summary: {
        type: String,
        trim: true, 
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String, 
        required: [true, 'A tour must have a description']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(), 
        select: false //dont show it
    },
    startDates: [Date], 
    secretTour: {
        type: Boolean,
        default: false 
    },
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId, 
            ref: 'User' 
        }
    ]
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true } 
    }
);

//tourSchema.index({ price: 1 })
tourSchema.index({ price: 1, ratingsAverage: -1 }); 
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });// must define it to use geospatial.


tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});


//virtual populate
tourSchema.virtual('reviews', {  
    ref: 'Review',//  This specifies that the virtual field reviews will refer to the Review model.
    foreignField: 'tour', // This indicates that in the Review model, the tour field holds the reference to the Tour document (i.e., the foreign key).
    localField: '_id' // This tells Mongoose that the _id field of the Tour document should be matched against the tour field in the Review model.
});


tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});


//QUERY MIDDLEWARE- means it run before any query from db we do.
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } })
    this.start = Date.now();
    next();
})


tourSchema.pre(/^find/, function (next) {
    this.populate({//with populate we fill the this tour with the data inpopultaes('guides').
       
        path: 'guides', // do the populate on this.
        select: '-__v -passwordChangedAt' // dont show this fields
    });

    next();
})


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour; 
