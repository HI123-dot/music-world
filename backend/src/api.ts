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
  const playlistRefs = await playlistsCollection.get();
  const playlists = await Promise.all(
    playlistRefs.docs.map(async (playlistRef) => {
      const dbPlaylist = playlistRef.data();
      const songs = (
        await Promise.all(
          dbPlaylist.songIds.map(async (songId) => {
            const dbSong = await songsCollection
              .doc(songId)
              .get()
              .then((songDoc) => songDoc.data());
            if (!dbSong) return undefined;

            const tags = (
              await Promise.all(
                dbSong.tagIds.map(async (id) => {
                  const tag = (await tagsCollection.doc(id).get()).data();
                  if (!tag) return null;
                  return {
                    id,
                    name: tag.name,
                    tagColor: tag.tagColor
                  };
                })
              )
            ).filter((tag) => tag !== null);

            return {
              link: dbSong.link,
              tags: tags,
              id: songId
            };
          })
        )
      ).filter((song) => song != undefined);

      return {
        name: dbPlaylist.name,
        songs: songs.filter((song) => song !== undefined),
        id: playlistRef.id
      };
    })
  );

  res.status(200).json(playlists);
});

app.post("/addTag", async (req, res) => {
  const name = req.body.name as string;
  const tagColor = req.body.tagColor as string;
  const tagRef = tagsCollection.doc();
  await tagRef.set({
    name: name,
    tagColor: tagColor
  });

  res.status(201).json({
    name: name,
    tagColor: tagColor,
    id: tagRef.id
  });
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
  const dbPlaylist = {
    name: name,
    songIds: []
  };
  const playlistRef = playlistsCollection.doc();
  await playlistRef.set(dbPlaylist);

  res.status(201).json({
    name: name,
    songs: [],
    id: playlistRef.id
  });
});

app.post("/addSong", async (req, res) => {
  const link = req.body.link;
  const playlistId = req.body.playlistId;

  // Add song to database
  const dbSong = {
    link: link,
    tagIds: []
  };
  const songRef = songsCollection.doc();
  await songRef.set(dbSong);

  // Add song ID to playlist
  const playlistRef = playlistsCollection.doc(playlistId);
  const playlistDoc = await playlistRef.get();
  if (!playlistDoc.exists) {
    return res.status(404).json({ error: "Playlist not found" });
  }

  const dbPlaylist = playlistDoc.data() as DBPlaylist;
  dbPlaylist.songIds.push(songRef.id);
  await playlistRef.set(dbPlaylist);

  res.status(201).json({
    link: link,
    tags: [],
    id: songRef.id
  });
});

app.post("/tagSong", async (req, res) => {
  const { songId, tagId } = req.body;

  if (!songId || !tagId) {
    return res
      .status(400)
      .json({ error: "Missing required fields: songId, tagId" });
  }

  const songRef = songsCollection.doc(songId);
  const dbSong = (await songRef.get()).data();
  if (!dbSong) {
    return res.status(404).json({ error: "Song not found" });
  }

  await songRef.set({
    ...dbSong,
    tagIds: Array.from(new Set([...dbSong.tagIds, tagId]))
  });

  // Making the response
  const tags = (
    await Promise.all(
      dbSong.tagIds.map(async (id) => {
        const tag = (await tagsCollection.doc(id).get()).data();
        if (!tag) return null;
        return {
          id,
          name: tag.name,
          tagColor: tag.tagColor
        };
      })
    )
  ).filter((tag) => tag !== null);

  res.status(200).json({
    id: songRef.id,
    link: dbSong.link,
    tags: tags
  });
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
export const handler = serverless(app);
