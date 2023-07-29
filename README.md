# orbi-tech-challenge
Node.js + Express.js app to serve the API and frontend app.
## run dev env

```bash
# run nodemon
$ npm run dev

```

The project has a dashboard that can be accessed on http://localhost:PORT. 

The api endpoints can be accessed from http://localhost:PORT/api.

PORT can be configured in the .env file.

## env
All the required secret keys and variables were sent in the contact email.
```
PORT=3000
MONGO_DB=<db>
MONGO_USER=<user>
MONGO_PASSWORD=<pass>
JWT_TOKEN_KEY=<secret>
SERVER_HOST=http://localhost:3000
SENDGRID_KEY=<sendgrid key>
```