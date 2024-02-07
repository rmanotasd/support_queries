const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const aggregationPipeline = require('./pipelines/aggt');

const DB_UAT = process.env.URI_UAT;
const DB_PRD = process.env.URI_PRD;
const PORT = process.env.PORT || 3000;

const app = express();
const TOKEN = "Bearer a5mo5CO0Rv2by7GJ69vfU3lBmQL1ZVnZN3v77Uw4";
const verifyToken = (req, res, next) => {
  // Verify Authorization header exists
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token provided' });
  }
  // Verify token matches
  if (token !== TOKEN) {
    return res.status(401).json({ success: false, message: 'Invalid Token' });
  }
  next();
};

app.use(verifyToken);
app.get('/authentication', (req, res) => {
  res.json({ success: true, message: 'Route reached' });
});

////////DB connection///////////
mongoose.connect(DB_PRD, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('Connected to MongoDB');
});

// Schemas
const User = mongoose.model('User', {
  firstName: String,
  lastName: String,
  email: String,
  username: String,
  businessName: String,
});

// Query
app.use(bodyParser.json());
app.post('/api/query', async (req, res) => {
  
  try {
    var { email, date, limit } = req.body;
    const dateTime = moment(date, 'YYYY-MM-DD hh:mm A').utc().toISOString()
    var pipeline = aggregationPipeline(email, dateTime);
    //Aggregation query
    var result = await User.aggregate(pipeline);

///add +2 hrs to keep a limit of results. If result is less or equal to submited date
  var newResult = result.filter(r => moment(r.reportCreationDate).isSameOrBefore(moment(dateTime).add(limit.split(' ')[0],limit.split(' ')[1])))

    if (newResult.length === 0) {
      // If no query results were found, send an error message
      return res.status(200).json({ message: "No results were found for the query provided." });
    }

    res.json(newResult);
  } catch (error) {
    console.error('Error when querying user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
