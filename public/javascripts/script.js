const socket = io();
const chess = new Chess();

let playerRole  = null;
let click = 0;
let source, target;
function joinRoom() {
   let roomId = document.querySelector("#joinRoom #roomId").value
   let usr = document.querySelector("#joinRoom #name").value
   socket.emit("joinRoom", roomId, usr)
}

function setupBoard() {
   const BOARD = chess.board();
   const board = document.getElementById("board");
   board.innerHTML =""
   BOARD.forEach((row, i)=>{
      row.forEach((item, j)=>{
         let code = getUnicode(item);
         let squareElem = document.createElement("div")
         squareElem.classList.add('square','flex', 'items-center', 'justify-center', `${((i+j)%2 ==0 ? 'white' : 'black')}`)
         squareElem.dataset.row = i
         squareElem.dataset.col = j
         
         if (item) {
            let pieceElem = document.createElement("div")
            pieceElem.classList.add((item.color === 'b') ? "text-black" : "text-white" )
            pieceElem.innerHTML = code
            
            squareElem.appendChild(pieceElem)
            if (playerRole === "b") {
               board.style.transform = "rotate(180deg)"
               pieceElem.style.transform = "rotate(180deg)"
            }
         }
         board.appendChild(squareElem)
      });
   });
   handleClickEvents()
}

function handleClickEvents() {

   let squareElem = document.querySelectorAll(".square")
   squareElem.forEach((item)=>{
      item.addEventListener("click", ()=>{
         (click < 2) ? click++ : click = 0
         if (click === 1){
            source = item;
         }
         else if (click === 2){
            target = item;
            click= 0;
            handleMove(source, target)
         }
         
      });
   })
   
}

function handleMove(source, target) {
   let move = {
      from: `${String.fromCharCode(97+parseInt(source.dataset.col))}${8- source.dataset.row}`,
      to: `${String.fromCharCode(97+parseInt(target.dataset.col))}${8- target.dataset.row}`,
      promotion: "q"
   }
   socket.emit("move", move)
}

socket.on("joined", (dets)=>{
   playerRole = dets.role 
   setupBoard()
})

socket.on("role", (roleW, roleB)=>{
   let player1 = document.querySelector("#player1 span");
   let player2 = document.querySelector("#player2 span");
   player1.textContent = roleW.name
   player2.textContent = roleB.name
});

socket.on("boardState", (fen)=>{
   chess.load(fen)
   setupBoard()
})

socket.on("move", (move)=>{
   chess.move(move)
   setupBoard()
})

function getUnicode(item) {
   const ITEMS =[
      {
         code: '&#9812;',
         type: "k",
         color: "w"
      },
      {
         code: '&#9813;',
         type: "q",
         color: "w"
      },
      {
         code: '&#9814;',
         type: "r",
         color: "w"
      },
      {
         code: '&#9815;',
         type: "b",
         color: "w"
      },
      {
         code: '&#9816;',
         type: "n",
         color: "w"
      },
      {
         code: '&#9817;',
         type: "p",
         color: "w"
      },
      // black
      {
         code: '&#9818;',
         type: "k",
         color: "b"
      },
      {
         code: '&#9819;',
         type: "q",
         color: "b"
      },
      {
         code: '&#9820;',
         type: "r",
         color: "b"
      },
      {
         code: '&#9821;',
         type: "b",
         color: "b"
      },
      {
         code: '&#9822;',
         type: "n",
         color: "b"
      },
      {
         code: '&#9823;',
         type: "p",
         color: "b"
      },
   ]
   let result = null
   if (item) {
      let type = item.type;
      let color = item.color;
      ITEMS.forEach(item =>{
         if(item.type == type && item.color == color){
            result = item.code;
         }
      });
   }
   return result;
}