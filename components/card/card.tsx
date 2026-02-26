import "./card.css"

interface Props{
    nombre: string;
    image: string;
    estado: string;
    ubicacion: string;
    especie: string;
    genero: string;
}

function Card({nombre, image, estado, ubicacion, especie, genero}: Props) {
    return (
        <div className="contenedor">
            <div className="card">
                <img src={image} alt="Personaje" />
                <div className="card-info">
                    <h2>{nombre}</h2>
                    <p>{estado}</p>
                    <p>{ubicacion}</p>
                    <p>{especie}</p>
                    <p>{genero}</p>
                </div>
            </div>
        </div>
    );
}

export default Card;