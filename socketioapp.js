const express = require('express')
const socketIo = require('socket.io')
const http = require('http')
const PORT = process.env.PORT || 8080
const app = express()
const server = http.createServer(app)

const cors = require('cors')
// que salte la seguridad de cors para todas las peticiones
app.use(cors())

// necesario para que Express pueda reconocer el JSON del cliente
const bodyParser = require('body-parser');
app.use(bodyParser.json())

const io = socketIo(server, {
  // direccion de la url cliente (React)
  cors: {
    origin: 'http://localhost:3000'
  }
})

let state = [
  {
    'name': 'Laura',
    'pass': '1234',
    'channel': 'rojo',
    'counter': 0,
  },
  {
    'name': 'Cristo',
    'pass': '1234',
    'channel': 'rojo',
    'counter': 0,
  },
  {
    'name': 'Edu',
    'pass': '1234',
    'channel': 'verde',
    'counter': 0,
  },
  {
    'name': 'Fran',
    'pass': '1234',
    'channel': 'verde',
    'counter': 0,
  }
]

app.post('/api/login', (req, res) => {
  // busca el usuario dentro de state y lo compara con lo recibido por cliente
  const user = state.find(u => u.name === req.body.user)

  if (!user) {
    res.status(404).send('El usuario no existe')
  }

  if (user.pass === req.body.pass) {
    // conexion con el socket
    // Respuesta para el cliente con el canal conectado
    res.send({
      'response': 'yes',
      'channel': user.channel,
      'name': user.name,
      'counter': user.counter
    })

    io.on('connection', (socket) => {
      console.log('client connected: ', socket.id)
      // numero de clientes conectados al io 
      console.log('clientes conectados: ', io.engine.clientsCount)

      // que se conecte a la sala que le toca
      socket.join(user.channel)

      // actualizacion del contador
      socket.on('changeCounter', (counter) => {
        // TODO que lo recoja de BD
        const room = state.filter(o => o.channel === user.channel)
        // que actualice el valor de todos los contadores del canal
        room.forEach(user => user.counter = counter)
        // devuelve el estado a todo el canal menos al que manda
        socket.broadcast.emit('update', counter)
      })

      // en caso de desconexion que de el motivo
      socket.on('disconnect', (reason) => {
        console.log(reason)
      })
    })
  }
  else {
    res.send({ 'response': 'no' })
  }

})

server.listen(PORT, err => {
  if (err) console.log(err)
  console.log('Server running on Port ', PORT)
})
