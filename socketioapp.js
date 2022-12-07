const express = require('express')
const socketIo = require('socket.io')
const http = require('http')
const PORT = process.env.PORT || 8080
const app = express()
const server = http.createServer(app)

// necesario para acceder a dominios diferentes del servidor (React en este caso)
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
    'connected': false,
    'finished': false,
  },
  {
    'name': 'Cristo',
    'pass': '1234',
    'channel': 'rojo',
    'counter': 0,
    'connected': false,
    'finished': false,
  },
  {
    'name': 'Pepe',
    'pass': '1234',
    'channel': 'rojo',
    'counter': 0,
    'connected': false,
    'finished': false,
  },
  {
    'name': 'Edu',
    'pass': '1234',
    'channel': 'verde',
    'counter': 0,
    'connected': false,
    'finished': false,
  },
  {
    'name': 'Fran',
    'pass': '1234',
    'channel': 'verde',
    'counter': 0,
    'connected': false,
    'finished': false,
  }
]

// TODO que lo recoja de BD
// Devuelve la room cuando un usuario se conecta o desconecta
const setUserConnected = (user, value) => {
  // cambio del estado
  state[state.indexOf(user)].connected = value
  // devuelve la nueva room
  return state.filter(o => o.channel === user.channel)
}

const setCounter = (channel, value) => {
  // cambio del estado
  state.forEach(o => {
    if (o.channel === channel) o.counter = value
  })
}

app.post('/api/login', (req, res) => {
  // busca el usuario dentro de state y lo compara con lo recibido por cliente
  const user = state.find(u => u.name === req.body.user)

  if (!user) {
    res.status(404).send('El usuario no existe')
  }

  if (user.pass !== req.body.pass) {
    res.send({ 'response': 'no' })
  }

  // Cambia el valor a conectado
  const room = setUserConnected(user, true)

  // conexion con el socket
  // Respuesta para el cliente con el canal conectado pasando el contador 
  // actual
  res.send({
    'user': {
      'response': 'yes',
      'channel': user.channel,
      'name': user.name,
      'counter': user.counter,
      'connected': user.connected,
      'finished': user.finished,
    },
    'room': room
  })

  io.on('connection', (socket) => {
    console.log('client connected: ', socket.id)
    // numero de clientes conectados al io 
    console.log('clientes conectados: ', io.engine.clientsCount)

    // que se conecte a la sala que le toca
    socket.join(user.channel)

    // indica a los demas que el usuario se ha conectado a la sala
    socket.broadcast.emit('connection', room)

    // actualizacion del contador
    socket.on('changeCounter', (counter) => {
      console.log("Cambio de contador")
      // que actualice el valor de todos los contadores del canal
      setCounter(user.channel, counter)
      // devuelve el estado a todo el canal menos al que manda
      socket.broadcast.emit('update', counter)
    })

    // TICKET tienes el problema de las desconexiones. El socket se 
    // desconecta correctamente pero pone todo los usuarios en desconectado
    // cuando se cierra la conexion. Parece que cada vea que alguien hace login
    // se guarda el usuario en este ambito local...

    // en caso de desconexion que de el motivo
    socket.on('disconnect', (reason) => {
      // Cambia el valor a desconectado
      io.in(user.channel).emit('connection', setUserConnected(user, false))
      console.log('Desconectado el cliente: ', user.name)
      console.log('Desconectado el socket: ', socket.id)
      console.log('clientes conectados: ', io.engine.clientsCount)
      console.log(reason)
    })
  })
})


server.listen(PORT, err => {
  if (err) console.log(err)
  console.log('Server running on Port ', PORT)
})
