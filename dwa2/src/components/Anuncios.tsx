import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import * as anunciosService from '../data/anunciosService'
import type { Anuncio } from '../data/anunciosService'
import { getCarreras } from '../data/carrerasService'
import type { Carrera } from '../types/Carrera'
import styles from './Anuncios.module.css'

interface AnunciosProps {
  usuarioId: number
  rol: 'alumno' | 'coordinador'
}

const DESTINO_TODOS = 'todos'

export const Anuncios = ({ usuarioId, rol }: AnunciosProps) => {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [cargando, setCargando] = useState(true)
  const [carreras, setCarreras] = useState<Carrera[]>([])

  // Form estado
  const [mostrarForm, setMostrarForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [destino, setDestino] = useState<string>(DESTINO_TODOS)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  // Eliminar
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  const cargarAnuncios = useCallback(async () => {
    try {
      const data = rol === 'alumno'
        ? await anunciosService.getAnunciosAlumno(usuarioId)
        : await anunciosService.getAnunciosCoordinador(usuarioId)
      setAnuncios(data)
    } catch (err) {
      console.error('Error cargando anuncios:', err)
    } finally {
      setCargando(false)
    }
  }, [usuarioId, rol])

  useEffect(() => {
    cargarAnuncios()
  }, [cargarAnuncios])

  // Cargar carreras solo cuando el coordinador abre el form
  useEffect(() => {
    if (mostrarForm && carreras.length === 0) {
      getCarreras().then(setCarreras).catch(console.error)
    }
  }, [mostrarForm])

  const cerrarForm = () => {
    setMostrarForm(false)
    setTitulo('')
    setContenido('')
    setDestino(DESTINO_TODOS)
    setErrorForm(null)
  }

  const publicarAnuncio = async () => {
    if (!titulo.trim()) { setErrorForm('El título no puede estar vacío'); return }
    if (!contenido.trim()) { setErrorForm('El contenido no puede estar vacío'); return }

    setGuardando(true)
    setErrorForm(null)
    try {
      await anunciosService.crearAnuncio({
        coordinador_id: usuarioId,
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        carrera_id: destino === DESTINO_TODOS ? null : Number(destino),
      })
      cerrarForm()
      await cargarAnuncios()
    } catch (err: unknown) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo publicar el anuncio')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarAnuncio = async (id: number) => {
    setEliminandoId(id)
    try {
      await anunciosService.eliminarAnuncio(id)
      setAnuncios(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Error eliminando anuncio:', err)
    } finally {
      setEliminandoId(null)
    }
  }

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const etiquetaDestino = (anuncio: Anuncio) => {
    if (!anuncio.carrera_id) return 'Todas las carreras'
    return anuncio.carrera_nombre ?? `Carrera #${anuncio.carrera_id}`
  }

  return (
    <div className={styles.wrapper}>

      {/* Botón publicar (solo coordinador) */}
      {rol === 'coordinador' && (
        <div className={styles.toolbar}>
          <button className={styles.btnPublicar} onClick={() => setMostrarForm(true)}>
            <i className="fas fa-bullhorn" /> Nuevo anuncio
          </button>
        </div>
      )}

      {/* Modal / formulario de creación */}
      {mostrarForm && createPortal(
        <div className={styles.modalOverlay} onClick={cerrarForm}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nuevo anuncio</h2>
              <button className={styles.btnCerrarModal} onClick={cerrarForm} aria-label="Cerrar">
                <i className="fas fa-times" />
              </button>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.formLabel}>Destinatarios</label>
              <select
                className={styles.formSelect}
                value={destino}
                onChange={e => setDestino(e.target.value)}
              >
                <option value={DESTINO_TODOS}>Todas las carreras</option>
                {carreras.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>

              <label className={styles.formLabel}>Título</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Ej: Cambio de horario en semana de exámenes"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                maxLength={255}
              />

              <label className={styles.formLabel}>Contenido</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Escribe el cuerpo del anuncio aquí..."
                value={contenido}
                onChange={e => setContenido(e.target.value)}
                rows={5}
              />

              {errorForm && <p className={styles.errorForm}>{errorForm}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancelar} onClick={cerrarForm}>
                Cancelar
              </button>
              <button className={styles.btnPublicarModal} onClick={publicarAnuncio} disabled={guardando}>
                <i className={`fas ${guardando ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                {guardando ? ' Publicando...' : ' Publicar'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Lista de anuncios */}
      {cargando ? (
        <div className={styles.cargando}>Cargando anuncios...</div>
      ) : anuncios.length === 0 ? (
        <div className={styles.empty}>
          <i className="fas fa-bullhorn" />
          <p>{rol === 'coordinador' ? 'Aún no has publicado ningún anuncio.' : 'No hay anuncios disponibles.'}</p>
        </div>
      ) : (
        <div className={styles.lista}>
          {anuncios.map(anuncio => (
            <article key={anuncio.id} className={styles.tarjeta}>
              <div className={styles.tarjetaHeader}>
                <div className={styles.tarjetaMeta}>
                  <span className={`${styles.badgeDestino} ${!anuncio.carrera_id ? styles.badgeTodos : styles.badgeCarrera}`}>
                    <i className={`fas ${!anuncio.carrera_id ? 'fa-globe' : 'fa-graduation-cap'}`} />
                    {etiquetaDestino(anuncio)}
                  </span>
                  <span className={styles.tarjetaFecha}>{formatearFecha(anuncio.creado_en)}</span>
                </div>
                {rol === 'coordinador' && (
                  <button
                    className={styles.btnEliminar}
                    onClick={() => eliminarAnuncio(anuncio.id)}
                    disabled={eliminandoId === anuncio.id}
                    title="Eliminar anuncio"
                  >
                    <i className={`fas ${eliminandoId === anuncio.id ? 'fa-spinner fa-spin' : 'fa-trash'}`} />
                  </button>
                )}
              </div>

              <h3 className={styles.tarjetaTitulo}>{anuncio.titulo}</h3>
              <p className={styles.tarjetaContenido}>{anuncio.contenido}</p>

              <div className={styles.tarjetaFooter}>
                <i className="fas fa-user-tie" />
                <span>{anuncio.coordinador_nombre} {anuncio.coordinador_apellido}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
