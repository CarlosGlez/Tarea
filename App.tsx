import Card from './components/card/card'
import './App.css'
import {usePersonajes} from './components/hooks/index'

function App() {
 
  const {personajes: personajes} = usePersonajes()

  return (
    <>
    {
    personajes.map((p) => (
      <Card
      key={p.id}
        nombre={p.nombre}
        image={p.image}
        estado={p.estado}
        especie={p.especie}
        genero={p.genero}
        ubicacion={p.ubicacion}
      /> 
    ))}
    </>
  )
}

export default App
