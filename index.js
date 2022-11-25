// Objeto JSON temporal que almacena los usuarios
// esto se va a guardar despues en una BD. Va a ser modificable 
let users = [
  {
    "name": "Cristobal",
    "pass": "1234",
    "channel": "verde",
  },
  {
    "name": "Edu",
    "pass": "1234",
    "channel": "verde"
  },
  {
    "name": "Dani",
    "pass": "1234",
    "channel": "rojo"
  },
  {
    "name": "Laura",
    "pass": "1234",
    "channel": "rojo"
  }
]

const express = require('express');         // Peticiones http a server
const http = require('http');
const url = require('url');
const bodyParser = require('body-parser');  // Lectura de JSON por express
const cors = require('cors');
const WebSocket = require('ws');            // Sockets

// Crea el server de express
const app = express();

// middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

const server = http.createServer(app)

// Puedes crear tantos sockets como quieras
// Se gestionan dentro del server de Express
// Todo esta en la documentacion de ws (multiple servers)
const wsRojo = new WebSocket.Server({ noServer: true });
const wsVerde = new WebSocket.Server({ noServer: true });


// Set con el listado de usuarios conectados
const usersRojo = new Set();
const usersVerde = new Set();

// Cuenta actual
let counterRojo = 0;
let clientesRojo = [];
let counterVerde = 0;
let clientesVerde = [];

// Envia el mensaje a todos los usuarios conectados 
function sendMessage(message, usuariosCanal) {
  usuariosCanal.forEach((user) => {
    // El mensaje tiene que ir como un tipo privitivo o String
    user.ws.send(JSON.stringify(message));
  });
}

const handleSocket = (ws, usuarios, contador, clientes) => {
  // Agrega el usuario conectado al Set como un objeto
  const userRef = {
    ws,
  };
  usuarios.add(userRef);

  console.log(`Usuario conectado al canal rojo, hay ${usuarios.size} ws conectados`)

  // Envia el contador actual
  ws.send(JSON.stringify({ body: contador }))

  // Ejecuta al recibir un mensaje
  ws.on('message', (message) => {
    // Al recibir un mensaje se reenvía a todos los conectados
    try {

      // Convierte a JSON el mensaje stringify
      const data = JSON.parse(message);
      console.log(data)

      // Comprueba el tipo de mensaje
      if (data.type === 'Connection') {
        // si es connection que agregue un cliente nuevo a la lista
        clientes.push(data.body);
        console.log("Usuario conectado: ", clientes);
      } else {
        // Comprueba que el mensaje tiene los tipos adecuados
        if (
          typeof data.sender !== 'string' ||
          typeof data.body !== 'number'
        ) {
          console.error('Invalid message');
          return;
        }

        // incrementa el contador
        contador = data.body + 1;

        // Crea un nuevo mensaje como objeto JSON
        const messageToSend = {
          sender: data.sender,
          body: contador,
          sentAt: Date.now()
        }

        // Envia el mensaje a todos
        sendMessage(messageToSend, usuarios);
      }

    } catch (e) {
      console.error('Error passing message!', e)
    }
  });

  // Si se cierra la conexion
  ws.on('close', (code, reason) => {
    // Que se elimine el usuario del Set
    usuarios.delete(userRef);
    console.log(`Connection closed: ${code} ${reason}!`);
  });
}

// TODO crear un socket por cada aldea de la partida
// El comportamiento en ambos ws va a ser el mismo (crear una clase??)
wsRojo.on('connection', function connection(ws) {
  handleSocket(ws, usersRojo, counterRojo, clientesRojo)
});

wsVerde.on('connection', function connection(ws) {
  handleSocket(ws, usersVerde, counterVerde, clientesVerde)
});

app.post('/api/login', (req, res) => {
  const user = users.find(u => u.name === req.body.user)

  if (!user) {
    res.status(404).send('El usuario no existe')
  }
  if (user.pass === req.body.pass) {
    // conexion con el socket


    // Respuesta para el cliente con el canal conectado
    res.send({ 'response': 'yes', 'channel': user.channel, 'name': user.name })

  }
  else {
    res.send({ 'response': 'no' })
  }
})

// De momento dos canales creados a mano que recogen los usuarios que contienen
// info sobre ese canal en concreto. 
//
// TODO los usuarios se deben conectar a ese canal y ver como se cambia la info
// esto en principio no se va a tocar
server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = url.parse(request.url);
  console.log("Conexion a ", pathname)

  if (pathname === '/verde') {
    // Si la ruta es esa, el websocket se encarga de las peticiones
    wsVerde.handleUpgrade(request, socket, head, function done(ws) {
      wsVerde.emit('connection', ws, request);
    });
  } else if (pathname == '/rojo') {
    wsRojo.handleUpgrade(request, socket, head, function done(ws) {
      wsRojo.emit('connection', ws, request);
    });
  }
  else {
    // si no se corresponde con ninguno que se corte la conexion
    socket.destroy();
  }
});

server.listen(8080, () => console.log("Escuchando en puerto 8080..."));

