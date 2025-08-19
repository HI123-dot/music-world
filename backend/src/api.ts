import express from "express";

import serverless from "serverless-http";
import cors from "cors";
import * as winston from "winston";
import * as expressWinston from "express-winston";
import {
  songsCollection,
  playlistsCollection,
  tagsCollection
} from "./firebase";
import { playlistModel } from "./db/PlaylistModel";
import { songModel } from "./db/SongModel";
import { tagModel } from "./db/TagModel"


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
  const songs = songRefs.docs.map((songRef) => songRef.data());

  res.status(200).json(songs);
});

app.get("/getPlaylists", async ({}, res) => {
  const playlists = await playlistModel.getAllPlaylists();
  res.status(200).json(playlists);
});

app.get("/getTags", async ({}, res) => {
  const tagRefs = await tagsCollection.get();
  const tags = tagRefs.docs.map((tagRef) => ({
    ...tagRef.data(),
    id: tagRef.id
  }));





  res.status(200).json(tags);
});

app.post("/addPlaylist", async (req, res) => {
  const name = req.body.name;
  const playlist = await playlistModel.createPlaylist({
    name: name,
    songs: [],
    id: ""
  });

  res.status(201).json(playlist);
});

app.post("/addSong", async (req, res) => {
  const song = await songModel.createSong(req.body.playlistId, {
    link: req.body.link,
    tags: [],
    id: ""
  });

  res.status(201).json(song);
});
app.post("/addTag", async (req, res) => {
  const name = req.body.name as string;
  const tagColor = req.body.tagColor as string;
  const dbTag = req.body.dbTag as any
  const tagRef = tagsCollection.doc();
  await tagRef.set({
    name: name,
    tagColor: tagColor,
    id: dbTag.id,
  });

  res.status(201).json({
    name: name,
    tagColor: tagColor,
    id: tagRef.id
  });
});

app.post("/tagSong", async (req, res) => {
  const tag = await songModel.updateSong(req.body.playlistId, {
    link: req.body.link,
    tags: [],
    id: ""
    
});

app.delete("/deleteTag/:songId/:tagId", async (req, res) => {
  const { songId, tagId } = req.params;
  const songRef = songsCollection.doc(songId);
  const songDoc = await songRef.get();
  const songData = songDoc.data() as DBSong;
  const currentTagIds = songData.tagIds;
  const updatedTagIds = currentTagIds.filter((id) => id !== tagId);
  await songRef.update({ tagIds: updatedTagIds });
  res.status(204).json({});
});

app.delete("/deleteSong/:id", async (req, res) => {
  const id = req.params.id;

  const songRef = songsCollection.doc(id);
  await songRef.delete();

  // Remove song ID from all playlists
  const playlistRef = await playlistsCollection.get();
  playlistRef.docs.forEach(async (playlistDoc) => {
    const dbPlaylist = playlistDoc.data() as DBPlaylist;
    if (dbPlaylist.songIds.includes(id)) {
      dbPlaylist.songIds = dbPlaylist.songIds.filter((songId) => songId !== id);
      await playlistsCollection.doc(playlistDoc.id).set(dbPlaylist);
    }
  });

  res.status(204).json({});
});

app.delete("/deletePlaylist/:id", async (req, res) => {
  const id = req.params.id;

  const playlistRef = playlistsCollection.doc(id);
  const playlist = (await playlistRef.get()).data();
  playlist?.songIds.forEach(async (songId) => {
    await songsCollection.doc(songId).delete();
  });
  await playlistRef.delete();

  res.status(204).json({});
});

app.use("/.netlify/functions/api", router);

if (process.env.ENVIRONMENT !== "production") {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port: ${PORT}`);
  });
}
 const handler = serverless(app);})
