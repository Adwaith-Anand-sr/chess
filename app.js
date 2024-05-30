const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server)


app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


module.exports = { server, io, app };
