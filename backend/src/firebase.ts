import admin from "firebase-admin";
import { configureAccount } from "./firebase-utils";
import serviceAccount from "./firebase-config.json";
import dotenv from "dotenv";
dotenv.config();

export const app = admin.initializeApp({
  credential: admin.credential.cert(configureAccount(serviceAccount))
});

const db = admin.firestore();

export const songsCollection: admin.firestore.CollectionReference<DBSong> = db
  .collection("songs")
  .withConverter({
    fromFirestore(snapshot): DBSong {
      return snapshot.data() as DBSong;
    },
    toFirestore(userData: DBSong) {
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

export const tagsCollection: admin.firestore.CollectionReference<Tag> = db
  .collection("tags")
  .withConverter({
    fromFirestore(snapshot): Tag {
      return snapshot.data() as Tag;
    },
    toFirestore(userData: Tag) {
      return userData;
    }
  });
