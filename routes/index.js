const express = require("express");
const router = express.Router();
const { server, app, io } = require("../app");
const { Chess } = require("chess.js");
const mongodbConfig = require("../config/mongodbConfig");

const groupModel = require("../models/groups");
const playerModel = require("../models/players");

let players =[];
let currentPlayer
const chess = new Chess()


io.on("connection", (socket)=>{
   socket.on("chess", (chess)=>{
      console.log(chess, "\n");
   });
   
   socket.on("joinRoom", async (roomId, name)=>{
      let role ;
      let existGroup = await groupModel.findOne({roomId});
      if (existGroup) {
         existGroup.members.push(socket.id)
         await existGroup.save()
         socket.join(roomId);
         if (existGroup.members.length === 1) role = "w";
         else if (existGroup.members.length === 2 ) role = "b";
         else role = "spectator";
      }else {
         socket.join(roomId);
         let group = await groupModel.create({roomId});
         group.members.push(socket.id)
         await group.save()
         role = "w";
      }
      
      let player = await playerModel.create({
         name,
         id: socket.id,
         roomId,
         role
      })
      let roleW= await playerModel.findOne({roomId, role: "w"})
      let roleB = await playerModel.findOne({roomId, role: "b"})
      socket.emit("joined", player)
      if(roleW && roleB) io.to(`${player.roomId}`).emit("role", roleW, roleB)
      
   });
   
   socket.on("move", async(move)=>{
      console.log("yeye");
      let player =  await playerModel.findOne({id: socket.id}) 
      if (chess.turn() === "w" && player.role != "w") return
      if (chess.turn() === "b" && player.role != "b") return
      console.log("yoyo");
      try {
         let result = chess.move(move)
         console.log(result);
         if (result) {
            currentPlayer = chess.turn()
            console.log(player.roomId);
            io.to(`${player.roomId}`).emit("move", move)
            io.to(`${player.roomId}`).emit("boardState", chess.fen())
            // io.emit("move", move)
            // io.emit("boardState", chess.fen())
            console.log(currentPlayer);
         }else{
            console.log("invalid move :: ", move);
         }
      } catch (e) {
         console.log("invalid Move ", e);
      }
      
   })
   
   
   
   socket.on("disconnecting", async () => {

      let player = await playerModel.findOne({id: socket.id})
      if (player) {
         let group = await groupModel.findOne({roomId: player.roomId})
         for (let i = 0; i < group.members.length; i++) {
             if (group.members[i] === player.id) {
                 group.members.splice(i, 1);
                 await group.save();
                 console.log("done");
                 break;
             }
         }
         if (group.members.length === 0) {
            await groupModel.deleteOne({roomId: player.roomId});
         }
         await playerModel.deleteOne({id: socket.id});
      }
      
      
     
   });
});


app.get("/", (req, res)=>{
   res.render("index")
})


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
   console.log(`Server listening on port ${PORT}.`);
});