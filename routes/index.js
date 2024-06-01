const express = require("express");
const router = express.Router();
const { server, app, io } = require("../app");
const { Chess } = require("chess.js");
const mongodbConfig = require("../config/mongodbConfig");

const groupModel = require("../models/groups");
const playerModel = require("../models/players");


let currentPlayer
let games = {}; 

io.on("connection", (socket)=>{
   socket.on("chess", (c)=>{
      console.log(c);
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
      if (!games[roomId]) {
        games[roomId] = new Chess(); // Initialize a new chess game for the room
      }

      let roleW= await playerModel.findOne({roomId, role: "w"})
      let roleB = await playerModel.findOne({roomId, role: "b"})
      socket.emit("joined", player)
      if(roleW && roleB) io.to(`${player.roomId}`).emit("role", roleW, roleB)
   });
   
   socket.on("move", async(move)=>{
      let player =  await playerModel.findOne({id: socket.id}) 
      if (!player) {
        console.error("error", "Player not found.");
        return;
      }
      let chess = games[player.roomId]; // Retrieve the correct chess instance for the room
      if (!chess) {
        console.error("error", "Game not found.");
        return;
      }
      if (chess.turn() === "w" && player.role != "w") return
      if (chess.turn() === "b" && player.role != "b") return
      try {
         let result = chess.move(move)
         if (result) {
            io.to(`${player.roomId}`).emit("turn", chess.turn())
            io.to(`${player.roomId}`).emit("move", move)
            io.to(`${player.roomId}`).emit("boardState", chess.fen())
            if (chess.isCheckmate()) {
               io.to(`${player.roomId}`).emit("checkmate")
               return
            }
            if (chess.inCheck()) {
               io.to(`${player.roomId}`).emit("check")
            }
         }else{
            console.log("invalid move :: ", move);
         }
      } catch (e) {
         console.log("An error occurred while processing the move\n ", e);
      }
   })
   
   
   
   socket.on("disconnecting", async () => {
      try{
         let player = await playerModel.findOne({id: socket.id})
         if (player) {
            let group = await groupModel.findOne({roomId: player.roomId})
            if (group) {
               // for (let i = 0; i < group.members.length; i++) {
               //     if (group.members[i] === player.id) {
               //        group.members.splice(i, 1);
               //        await group.save();
               //        console.log("done");
               //        break;
               //     }
               // }
               group.members = group.members.filter(memberId => memberId !== player.id);
               await group.save();
               if (group.members.length === 0) {
                  delete games[player.roomId]; // Remove the game state when all players leave the room
                  await groupModel.deleteOne({ roomId: player.roomId });
               }
            }
            
            await playerModel.deleteOne({id: socket.id});
         }
      }
      catch(error){
         console.error("Error during disconnection:", error);
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