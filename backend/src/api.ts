import express from "express";
// import express, { RequestHandler, Request, Response } from "express";

import serverless from "serverless-http";
import cors from "cors";
// import admin from "firebase-admin";
import * as winston from "winston";
import * as expressWinston from "express-winston";
import { app as firebaseApp, songsCollection } from "./firebase";
// import { v4 as uuidv4 } from "uuid";
// import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";

// Constants and configurations
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 9000;

const allowedOrigins = [/http:\/\/localhost:3000/];

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json({ limit: "50mb" }));

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.align(),
      winston.format.printf(
        (info) =>
          `${info.timestamp} ${info.level} - ${info.meta.req.method} ${
            info.meta.req.originalUrl
          } ${info.meta.res.statusCode} -- ${JSON.stringify(
            info.meta.req.body
          )}`
      )
    ),
    requestWhitelist: ["body", "method", "originalUrl"],
    responseWhitelist: ["body", "statusCode"]
  })
);

app.get("/getSongs", async ({}, res) => {
  const songRefs = await songsCollection.get();
  const songs = await Promise.all(
    songRefs.docs.map(async (songRef) => songRef.data())
  );

  res.status(200).json(songs);
});

app.use("/.netlify/functions/api", router);

if (process.env.ENVIRONMENT !== "production") {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port: ${PORT}`);
  });
}
export const handler = serverless(app);
