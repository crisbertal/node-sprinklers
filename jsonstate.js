// **************************************************************************
// Gestion de estado
// **************************************************************************
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

let contadores = [
  {
    "channel": "rojo",
    "counter": 0,
  },
  {
    "channel": "verde",
    "counter": 0,
  }
]
