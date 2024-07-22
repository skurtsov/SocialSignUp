const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = '977186718526-14rdv2hqrkq7d77vbipibi4farp8in9r.apps.googleusercontent.com';
const my_client = new OAuth2Client(CLIENT_ID);

// MongoDB Connection
const uri = "mongodb+srv://simon:s53em4e10@cluster0.vleofry.mongodb.net/formulario?retryWrites=true&w=majority";
let db;

MongoClient.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: true,
})
  .then(client => {
    console.log('Connected to MongoDB Atlas');
    db = client.db('formulario');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => console.error('Error connecting to MongoDB Atlas', error));

app.get('/test', (req, res) => {
  res.send('working good');
});

app.post('/google-login', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await my_client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await db.collection('users').findOne({ email });
    if (!user) {
      user = { email };
      await db.collection('users').insertOne(user);
    }

    res.status(201).send({ message: 'Пользователь зарегистрирован', email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Ошибка при регистрации', error });
  }
});

app.post('/api/facebook-login', async (req, res) => {
  const { accessToken } = req.body;
  try {
    const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,email`);
    const data = await response.json();

    if (!data.email) {
      throw new Error('Facebook login error: Email not found');
    }

    let user = await db.collection('users').findOne({ email: data.email });
    if (!user) {
      user = { email: data.email, facebookId: data.id };
      await db.collection('users').insertOne(user);
    }

    res.status(200).send({ message: 'Успешный вход через Facebook', user });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Ошибка при входе через Facebook', error });
  }
});

app.post('/register', async (req, res) => {
  const { email } = req.body;
  try {
    let user = await db.collection('users').findOne({ email: email });
    if (!user) {
      user = { email: email };
      await db.collection('users').insertOne(user);
    }

    res.status(200).send({ message: 'Success register', user });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error Facebook', error });
  }
});
