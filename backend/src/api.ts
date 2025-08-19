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
import { tagModel } from "./db/TagModel";

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
  const songs = await songModel.getAllSongs();
  res.status(200).json(songs);
});

app.get("/getPlaylists", async ({}, res) => {
  const playlists = await playlistModel.getAllPlaylists();
  res.status(200).json(playlists);
});

app.post("/addTag", async (req, res) => {
  const name = req.body.name as string;
  const tagColor = req.body.tagColor as string;

  const tag = await tagModel.createTag({
    name: name,
    tagColor: tagColor,
    id: ""
  });

  res.status(201).json(tag);
});

app.get("/getTags", async ({}, res) => {
  const tags = await tagModel.getAllTags();
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

app.post("/tagSong", async (req, res) => {
  const { songId, tagId } = req.body;

  if (!songId || !tagId) {
    return res
      .status(400)
      .json({ error: "Missing required fields: songId, tagId" });
  }

  await songModel.addTagToSong(songId, tagId);
  res.status(200).json({});
});

app.delete("/deleteTag/:songId/:tagId", async (req, res) => {
  const { songId, tagId } = req.params;
  await songModel.removeTagFromSong(songId, tagId);
  res.status(204).json({});
});

app.delete("/deleteSong/:playlistId/:songId", async (req, res) => {
  const playlistId = req.params.playlistId;
  const songId = req.params.songId;
  await songModel.deleteSong(playlistId, songId);
  res.status(204).json({});
});

app.delete("/deletePlaylist/:id", async (req, res) => {
  const id = req.params.id;
  await playlistModel.deletePlaylist(id);
  res.status(204).json({});
});

app.use("/.netlify/functions/api", router);

if (process.env.ENVIRONMENT !== "production") {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on port: ${PORT}`);
  });
}
export const handler = serverless(app);
