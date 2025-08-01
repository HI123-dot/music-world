import admin from "firebase-admin";
import { configureAccount } from "./firebase-utils";
import serviceAccount from "./firebase-config.json";
import dotenv from "dotenv";
dotenv.config();

export const app = admin.initializeApp({
  credential: admin.credential.cert(configureAccount(serviceAccount))
});

const db = admin.firestore();

export const songsCollection: admin.firestore.CollectionReference<Song> = db
  .collection("songs")
  .withConverter({
    fromFirestore(snapshot): Song {
      return snapshot.data() as Song;
    },
    toFirestore(userData: Song) {
      return userData;
    }
  });

export const playlistsCollection: admin.firestore.CollectionReference<DBPlaylist> =
  db.collection("playlists").withConverter({
    fromFirestore(snapshot): DBPlaylist {
      return snapshot.data() as DBPlaylist;
    },
    toFirestore(userData: DBPlaylist) {
      return userData;
    }
  });
