import admin from "firebase-admin";
import { configureAccount } from "./firebase-utils";
import serviceAccount from "./firebase-config.json";
import dotenv from "dotenv";
dotenv.config();

export const app = admin.initializeApp({
  credential: admin.credential.cert(configureAccount(serviceAccount))
});

// const db = admin.firestore();
// Create collections here
