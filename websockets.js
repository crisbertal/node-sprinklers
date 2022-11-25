const WebSocket = require('ws');            // Sockets

// Crea el websocket en el puerto indicado
const server = new WebSocket.Server({
  port: 8080
},
  () => {
    console.log('Server started on port 8080');
  }
);

// Set con el listado de usuarios conectados
const users = new Set();

// Cuenta actual
let counter = 0;
let clientes = [];

// Envia el mensaje a todos los usuarios conectados 
function sendMessage(message) {
  users.forEach((user) => {
    // El mensaje tiene que ir como un tipo privitivo o String
    user.ws.send(JSON.stringify(message));
  });
}

// Se ejecuta al recibir una conexion por WebSocket
server.on('connection', (ws) => {
  // Agrega el usuario conectado al Set como un objeto
  const userRef = {
    ws,
  };
  users.add(userRef);

  console.log(`Usuario conectado, hay ${users.size} ws conectados`)

  // Envia el contador actual
  ws.send(JSON.stringify({ body: counter }))

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
        counter = data.body + 1;

        // Crea un nuevo mensaje como objeto JSON
        const messageToSend = {
          sender: data.sender,
          body: counter,
          sentAt: Date.now()
        }

        // Envia el mensaje a todos
        sendMessage(messageToSend);
      }

    } catch (e) {
      console.error('Error passing message!', e)
    }
  });

  // Si se cierra la conexion
  ws.on('close', (code, reason) => {
    // Que se elimine el usuario del Set
    users.delete(userRef);
    console.log(`Connection closed: ${code} ${reason}!`);
  });
});
