const express = require('express');
const cors = require('cors');
const BodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(BodyParser.json());
app.use(express.static('doctors'));
app.use(fileUpload());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v9ypd.mongodb.net/${process.env
// 	.DB_NAME}?retryWrites=true&w=majority`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fvccc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect((err) => {
	const usersCollection = client.db('doctorsPortal').collection('users');
	const doctorsCollection = client.db('doctorsPortal').collection('doctors');
	const appointmentCollection = client.db('doctorsPortal').collection('appointments');
	const reviewCollection = client.db('doctorsPortal').collection('addReviews');


	console.log('Doctors Portal DataBase Connected');

	//Routes -- Get method
	// Root Route
	app.get('/', (req, res) => res.send('Welcome to Doctors Portal Backed'));

	//USER POST API 
	app.post('/users', async (req, res) => {
		const user = req.body;
		const result = await usersCollection.insertOne(user);
		// console.log(result);
		res.json(result);
	});

	app.get('/users', async (req, res) => {
		const cursor = usersCollection.find({});
		const user = await cursor.toArray();
		res.send(user)

	})

	app.put('/users/admin', async (req, res) => {
		const user = req.body;
		// console.log(user);
		const filter = { email: user.email };
		const options = { upsert: true };

		const updateDoc = { $set: { role: 'admin' } };
		const result = await usersCollection.updateOne(filter, updateDoc, options);
		res.json(result);
	})

	app.get('/users/:email', async (req, res) => {
		const email = req.params.email;
		const query = { email: email };
		const user = await usersCollection.findOne(query);
		let isAdmin = false;
		if (user?.role === 'admin') {
			isAdmin = true;
		}
		res.json({ admin: isAdmin });
	})

	//DELETE USER API
	app.delete('/deleteUser/:id', async (req, res) => {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		const result = await usersCollection.deleteOne(query);
		// console.log(result);
		res.send(result)
	})

	//DOCTORS POST API
	app.post('/doctors', async (req, res) => {
		const doctors = req.body;
		const result = await doctorsCollection.insertOne(doctors)
		// console.log(result);
		res.json(result)
	});

	//DOCTORS GET API
	app.get('/doctors', async (req, res) => {
		const cursor = doctorsCollection.find({});
		const doctors = await cursor.toArray();
		res.send(doctors)
	})

	//DOCTORS Single Item
	app.get('/doctors/:id', async (req, res) => {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		const result = await doctorsCollection.findOne(query);
		res.send(result)
	})


	//APPOINTMENT POST API
	app.post('/appointments', async (req, res) => {
		const appointments = req.body;
		const result = await appointmentCollection.insertOne(appointments)
		// console.log(result);
		res.json(result)
	});

	//APPOINTMENT GET API
	app.get('/appointments', async (req, res) => {
		const cursor = appointmentCollection.find({});
		const result = await cursor.toArray();
		res.json(result);
	})

	//DELETE APPOINTMENT API
	app.delete('/appointments/:id', async (req, res) => {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		const result = await appointmentCollection.deleteOne(query);
		// console.log(result);
		res.send(result)
	})

	//GET APPOINTMENT BY EMAIL
	app.get('/appointments/:email', async (req, res) => {
		// const email = req.query.email;
		const result = await appointmentCollection.find({ email: req.params.email }).toArray();
		// console.log(result);
		res.send(result)
	})

	//Cancel Appointments API
	app.delete('/cancelAppointments/:id', async (req, res) => {
		const id = req.params.id;
		const query = { _id: ObjectId(id) };
		const result = await appointmentCollection.deleteOne(query);
		// console.log(result);
		res.send(result)
	})

	// meetlink put
	app.put('/appointments/meetlink', async (req, res) => {
		const user = req.body;
		// console.log(user);
		const filter = { meetlink: user.meetlink };
		const options = { upsert: true };

		const updateDoc = { $set: { meetlink: 'meetlink' } };
		const result = await appointmentCollection.updateOne(filter, updateDoc, options);
		res.json(result);
	})

	// Added A New Doctor Review
	app.post('/addReviews', async (req, res) => {
		const review = req.body;
		const result = await reviewCollection.insertOne(review)
		// console.log(result);
		res.json(result)
	});

	//REVIEW GET API
	app.get('/addReviews', async (req, res) => {
		const cursor = reviewCollection.find({});
		const result = await cursor.toArray();
		res.send(result)
	})


	app.post('/addReview', (req, res) => {
		const reviewData = req.body;
		reviewCollection.insertOne(reviewData).then((result) => {
			res.send(result.insertedCount > 0);
			console.log(result.insertedCount, 'Review Data Inserted');
		});
	});

	//Routes -- Update method
	// Updating Booking Status
	app.post('/updateBookingStatus', (req, res) => {
		const ap = req.body;
		appointmentCollection.updateOne(
			{ _id: ObjectId(ap.id) },
			{
				$set: { status: ap.status },
				$currentDate: { lastModified: true }
			},
			(err, result) => {
				if (err) {
					console.log(err);
					res.status(500).send({ message: err });
				} else {
					res.send(result.modifiedCount > 0);
					console.log(result.modifiedCount, 'Update Booking Status');
				}
			}
		);
	});

	// Updating Appointment Date/Time
	app.post('/updateAppointmentTime', (req, res) => {
		const ap = req.body;
		appointmentCollection.updateOne(
			{ _id: ObjectId(ap.id) },
			{
				$set: { date: ap.date, time: ap.time },
				$currentDate: { lastModified: true }
			},
			(err, result) => {
				if (err) {
					console.log(err);
					res.status(500).send({ message: err });
				} else {
					res.send(result.modifiedCount > 0);
					console.log(result.modifiedCount, 'Update Appointment Date / Time');
				}
			}
		);
	});

	// Added Meeting Link
	app.post('/addedMeetingLink', (req, res) => {
		const ap = req.body;
		appointmentCollection.updateOne(
			{ _id: ObjectId(ap.id) },
			{
				$set: { meeting: ap.meeting },
				$currentDate: { lastModified: true }
			},
			(err, result) => {
				if (err) {
					console.log(err);
					res.status(500).send({ message: err });
				} else {
					res.send(result.modifiedCount > 0);
					console.log(result.modifiedCount, 'Meeting Link Inserted');
				}
			}
		);
	});

	// Updating Appointment Visiting Status
	app.post('/updateVisitingStatus', (req, res) => {
		const ap = req.body;
		appointmentCollection.updateOne(
			{ _id: ObjectId(ap.id) },
			{
				$set: { visitingStatus: ap.visitingStatus },
				$currentDate: { lastModified: true }
			},
			(err, result) => {
				if (err) {
					console.log(err);
					res.status(500).send({ message: err });
				} else {
					res.send(result.modifiedCount > 0);
					console.log(result.modifiedCount, 'Update <Visiti></Visiti>ng Status');
				}
			}
		);
	});

	// Updating Prescription
	app.post('/updatePrescription', (req, res) => {
		const ap = req.body;
		appointmentCollection.updateOne(
			{ _id: ObjectId(ap.id) },
			{
				$set: { prescription: ap.prescription },
				$currentDate: { lastModified: true }
			},
			(err, result) => {
				if (err) {
					console.log(err);
					res.status(500).send({ message: err });
				} else {
					res.send(result.modifiedCount > 0);
					console.log(result.modifiedCount, 'Update Prescription');
				}
			}
		);
	});

	// Updating Disease
	app.post('/updateDisease', (req, res) => {
		const ap = req.body;
		appointmentCollection.updateOne(
			{ _id: ObjectId(ap.id) },
			{
				$set: { disease: ap.problem },
				$currentDate: { lastModified: true }
			},
			(err, result) => {
				if (err) {
					console.log(err);
					res.status(500).send({ message: err });
				} else {
					res.send(result.modifiedCount > 0);
					console.log(result.modifiedCount, 'Update Disease');
				}
			}
		);
	});

	// Added Payment
	app.post('/addedPayment', (req, res) => {
		const ap = req.body;
		appointmentCollection.updateOne(
			{ _id: ObjectId(ap.id) },
			{
				$set: { paymentID: ap.paymentID },
				$currentDate: { lastModified: true }
			},
			(err, result) => {
				if (err) {
					console.log(err);
					res.status(500).send({ message: err });
				} else {
					res.send(result.modifiedCount > 0);
					console.log(result.modifiedCount, 'Payment Inserted');
				}
			}
		);
	});

});


app.listen(port, (err) => (err ? console.log('Filed to Listen on Port', port) : console.log('Listing for Port', port)));
