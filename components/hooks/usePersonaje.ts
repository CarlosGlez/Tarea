import {useEffect, useState} from "react";  
import type {Personaje} from "../types";


const usePersonaje = () => {
    const [personajes, setPersonaje] = useState<Personaje[]>([]);

    const traerPersonajes = async () => {
        try {
            const response = await fetch('https://rickandmortyapi.com/api/character')
                const datos = await response.json();
                const listadoPersonajes = datos.results.map((p: any) => ({
                    id: p.id,
                    nombre: p.name,
                    estado: p.status,
                    especie: p.species,
                    genero: p.gender,
                    image: `https://rickandmortyapi.com/api/character/avatar/${p.id}.jpeg`,
                    ubicacion: p.location.name,
                }));
                setPersonaje(listadoPersonajes);
        } catch (error) {
            console.error("Error al traer los personajes:", error);
        }


    }

    useEffect(() => {
        traerPersonajes();
    },[]);

    return{
        personajes
    }
}
    export default usePersonaje