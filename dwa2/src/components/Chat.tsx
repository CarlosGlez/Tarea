import { useEffect, useRef, useState } from 'react'
import * as chatService from '../data/chatService'
import type { Conversacion, CoordinadorOpcion, Mensaje } from '../data/chatService'
import styles from './Chat.module.css'

interface ChatProps {
  usuarioId: number
  rol: 'alumno' | 'coordinador'
}

export const Chat = ({ usuarioId, rol }: ChatProps) => {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [conversacionActual, setConversacionActual] = useState<Conversacion | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [textoMensaje, setTextoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [asuntoNuevo, setAsuntoNuevo] = useState('')
  const [coordinadores, setCoordinadores] = useState<CoordinadorOpcion[]>([])
  const [coordinadorSeleccionado, setCoordinadorSeleccionado] = useState<number | ''>('')
  const [cargandoCoordinadores, setCargandoCoordinadores] = useState(false)
  const [creando, setCreando] = useState(false)
  const [errorNueva, setErrorNueva] = useState<string | null>(null)
  const [cargandoConversaciones, setCargandoConversaciones] = useState(true)
  const [cargandoMensajes, setCargandoMensajes] = useState(false)
  const [accionando, setAccionando] = useState(false)

  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const pollingConvRef = useRef<number | null>(null)
  const pollingMsgRef = useRef<number | null>(null)

  const cargarConversaciones = async () => {
    try {
      const data = await chatService.getConversaciones(usuarioId, rol)
      setConversaciones(data)
    } catch (err) {
      console.error('Error cargando conversaciones:', err)
    } finally {
      setCargandoConversaciones(false)
    }
  }

  const cargarMensajes = async (conversacionId: number) => {
    try {
      const data = await chatService.getMensajes(conversacionId)
      setMensajes(data)
      await chatService.marcarLeidos(conversacionId, usuarioId)
      setConversaciones(prev =>
        prev.map(c => c.id === conversacionId ? { ...c, mensajes_sin_leer: 0 } : c)
      )
    } catch (err) {
      console.error('Error cargando mensajes:', err)
    }
  }

  // Carga inicial + polling de conversaciones cada 10s
  useEffect(() => {
    cargarConversaciones()
    pollingConvRef.current = window.setInterval(cargarConversaciones, 10000)
    return () => {
      if (pollingConvRef.current) clearInterval(pollingConvRef.current)
    }
  }, [])

  // Polling de mensajes cada 5s cuando hay conversación abierta
  useEffect(() => {
    if (pollingMsgRef.current) clearInterval(pollingMsgRef.current)
    if (!conversacionActual) return

    setCargandoMensajes(true)
    cargarMensajes(conversacionActual.id).finally(() => setCargandoMensajes(false))

    pollingMsgRef.current = window.setInterval(() => {
      cargarMensajes(conversacionActual.id)
    }, 5000)

    return () => {
      if (pollingMsgRef.current) clearInterval(pollingMsgRef.current)
    }
  }, [conversacionActual?.id])

  // Scroll al último mensaje
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const abrirFormNueva = async () => {
    setMostrarNueva(true)
    if (rol === 'alumno' && coordinadores.length === 0) {
      setCargandoCoordinadores(true)
      try {
        const data = await chatService.getCoordinadoresCarrera(usuarioId)
        setCoordinadores(data)
        if (data.length > 0) setCoordinadorSeleccionado(data[0].id)
      } catch {
        setErrorNueva('No se pudieron cargar los coordinadores')
      } finally {
        setCargandoCoordinadores(false)
      }
    }
  }

  const cerrarFormNueva = () => {
    setMostrarNueva(false)
    setErrorNueva(null)
    setAsuntoNuevo('')
  }

  const seleccionarConversacion = (conv: Conversacion) => {
    setConversacionActual(conv)
  }

  const enviarMensaje = async () => {
    if (!textoMensaje.trim() || !conversacionActual || enviando) return
    setEnviando(true)
    try {
      await chatService.enviarMensaje(conversacionActual.id, usuarioId, textoMensaje)
      setTextoMensaje('')
      await cargarMensajes(conversacionActual.id)
    } catch (err) {
      console.error('Error enviando mensaje:', err)
    } finally {
      setEnviando(false)
    }
  }

  const crearConversacion = async () => {
    if (!asuntoNuevo.trim()) {
      setErrorNueva('El asunto no puede estar vacío')
      return
    }
    if (rol === 'alumno' && !coordinadorSeleccionado) {
      setErrorNueva('Selecciona un coordinador')
      return
    }
    setCreando(true)
    setErrorNueva(null)
    try {
      const coordId = coordinadorSeleccionado ? Number(coordinadorSeleccionado) : undefined
      const nueva = await chatService.crearConversacion(usuarioId, asuntoNuevo, coordId)
      const coordInfo = coordinadores.find(c => c.id === coordId)
      const convTemp: Conversacion = {
        id: nueva.id,
        asunto: asuntoNuevo.trim(),
        estado: 'abierta',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        mensajes_sin_leer: 0,
        coordinador_nombre: coordInfo?.nombre,
        coordinador_apellido: coordInfo?.apellido,
      }
      setAsuntoNuevo('')
      setMostrarNueva(false)
      await cargarConversaciones()
      setConversacionActual(convTemp)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear la conversación'
      setErrorNueva(msg)
    } finally {
      setCreando(false)
    }
  }

  const cerrarConversacion = async () => {
    if (!conversacionActual) return
    setAccionando(true)
    try {
      await chatService.cambiarEstadoConversacion(conversacionActual.id, 'cerrada')
      const actualizada = { ...conversacionActual, estado: 'cerrada' as const }
      setConversacionActual(actualizada)
      setConversaciones(prev => prev.map(c => c.id === actualizada.id ? actualizada : c))
    } catch (err) {
      console.error('Error cerrando conversación:', err)
    } finally {
      setAccionando(false)
    }
  }

  const reabrirConversacion = async () => {
    if (!conversacionActual) return
    setAccionando(true)
    try {
      await chatService.cambiarEstadoConversacion(conversacionActual.id, 'abierta')
      const actualizada = { ...conversacionActual, estado: 'abierta' as const }
      setConversacionActual(actualizada)
      setConversaciones(prev => prev.map(c => c.id === actualizada.id ? actualizada : c))
    } catch (err) {
      console.error('Error reabriendo conversación:', err)
    } finally {
      setAccionando(false)
    }
  }

  const eliminarConversacion = async () => {
    if (!conversacionActual) return
    if (!window.confirm('¿Eliminar esta conversación y todos sus mensajes? Esta acción no se puede deshacer.')) return
    setAccionando(true)
    try {
      await chatService.eliminarConversacion(conversacionActual.id)
      setConversaciones(prev => prev.filter(c => c.id !== conversacionActual.id))
      setConversacionActual(null)
      setMensajes([])
    } catch (err) {
      console.error('Error eliminando conversación:', err)
    } finally {
      setAccionando(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
  }

  const formatearHora = (fecha: string) =>
    new Date(fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha)
    if (d.toDateString() === new Date().toDateString()) return formatearHora(fecha)
    return d.toLocaleDateString()
  }

  const nombreInterlocutor = (conv: Conversacion) => {
    if (rol === 'alumno')
      return `${conv.coordinador_nombre ?? ''} ${conv.coordinador_apellido ?? ''}`.trim() || 'Coordinador'
    return `${conv.alumno_nombre ?? ''} ${conv.alumno_apellido ?? ''}`.trim() || 'Alumno'
  }

  return (
    <div className={styles.chatContainer}>
      {/* Panel izquierdo: lista de conversaciones */}
      <div className={styles.panelConversaciones}>
        <div className={styles.panelHeader}>
          <h2>Conversaciones</h2>
          {rol === 'alumno' && (
            <button
              className={styles.btnNueva}
              onClick={abrirFormNueva}
              title="Nueva conversación"
            >
              <i className="fas fa-plus" />
            </button>
          )}
        </div>

        {mostrarNueva && (
          <div className={styles.formNueva}>
            {cargandoCoordinadores ? (
              <div className={styles.cargando}>Cargando coordinadores...</div>
            ) : (
              <>
                {coordinadores.length > 0 && (
                  <>
                    <label className={styles.labelFormNueva}>Coordinador</label>
                    <select
                      className={styles.inputAsunto}
                      value={coordinadorSeleccionado}
                      onChange={e => setCoordinadorSeleccionado(Number(e.target.value))}
                    >
                      {coordinadores.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.apellido}
                          {c.rol_cargo ? ` — ${c.rol_cargo}` : ''}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <label className={styles.labelFormNueva}>Asunto</label>
                <input
                  type="text"
                  placeholder="Ej: Duda sobre mi kardex"
                  value={asuntoNuevo}
                  onChange={e => setAsuntoNuevo(e.target.value)}
                  className={styles.inputAsunto}
                  maxLength={255}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && crearConversacion()}
                />
                {errorNueva && <p className={styles.errorNueva}>{errorNueva}</p>}
                <div className={styles.formNuevaActions}>
                  <button className={styles.btnCancelar} onClick={cerrarFormNueva}>
                    Cancelar
                  </button>
                  <button className={styles.btnCrear} onClick={crearConversacion} disabled={creando}>
                    {creando ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {cargandoConversaciones ? (
          <div className={styles.cargando}>Cargando...</div>
        ) : conversaciones.length === 0 ? (
          <div className={styles.emptyConversaciones}>
            {rol === 'alumno'
              ? 'No tienes conversaciones. Pulsa + para iniciar una.'
              : 'No hay conversaciones aún.'}
          </div>
        ) : (
          <ul className={styles.listaConversaciones}>
            {conversaciones.map(conv => (
              <li
                key={conv.id}
                className={`${styles.itemConversacion} ${conversacionActual?.id === conv.id ? styles.itemActivo : ''} ${conv.estado === 'cerrada' ? styles.itemCerrada : ''}`}
                onClick={() => seleccionarConversacion(conv)}
              >
                <div className={styles.itemConvHeader}>
                  <span className={styles.itemInterlocutor}>{nombreInterlocutor(conv)}</span>
                  <span className={styles.itemFecha}>{formatearFecha(conv.actualizado_en)}</span>
                </div>
                <div className={styles.itemConvFooter}>
                  <span className={styles.itemAsunto}>{conv.asunto}</span>
                  <div className={styles.itemBadges}>
                    {conv.estado === 'cerrada' && (
                      <span className={styles.badgeCerrada}><i className="fas fa-lock" /></span>
                    )}
                    {conv.mensajes_sin_leer > 0 && (
                      <span className={styles.badgeSinLeer}>{conv.mensajes_sin_leer}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Panel derecho: mensajes */}
      <div className={styles.panelMensajes}>
        {!conversacionActual ? (
          <div className={styles.placeholderChat}>
            <i className="fas fa-comments" />
            <p>Selecciona una conversación para comenzar</p>
          </div>
        ) : (
          <>
            <div className={styles.mensajesHeader}>
              <div>
                <strong>{nombreInterlocutor(conversacionActual)}</strong>
                <span className={styles.asuntoHeader}>{conversacionActual.asunto}</span>
              </div>
              <div className={styles.headerAcciones}>
                <span className={`${styles.estadoBadge} ${conversacionActual.estado === 'cerrada' ? styles.cerrada : ''}`}>
                  {conversacionActual.estado === 'cerrada' ? 'Cerrada' : 'Abierta'}
                </span>
                {rol === 'coordinador' && (
                  <>
                    {conversacionActual.estado === 'abierta' ? (
                      <button
                        className={styles.btnAccionHeader}
                        onClick={cerrarConversacion}
                        disabled={accionando}
                        title="Marcar como resuelta y cerrar"
                      >
                        <i className="fas fa-check-circle" /> Cerrar
                      </button>
                    ) : (
                      <button
                        className={`${styles.btnAccionHeader} ${styles.btnReabrir}`}
                        onClick={reabrirConversacion}
                        disabled={accionando}
                        title="Reabrir conversación"
                      >
                        <i className="fas fa-redo" /> Reabrir
                      </button>
                    )}
                    <button
                      className={`${styles.btnAccionHeader} ${styles.btnEliminarConv}`}
                      onClick={eliminarConversacion}
                      disabled={accionando}
                      title="Eliminar conversación permanentemente"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={styles.listaMensajes}>
              {cargandoMensajes && mensajes.length === 0 ? (
                <div className={styles.cargando}>Cargando mensajes...</div>
              ) : mensajes.length === 0 ? (
                <div className={styles.emptyMensajes}>No hay mensajes. Sé el primero en escribir.</div>
              ) : (
                mensajes.map(msg => {
                  const esMio = msg.remitente_id === usuarioId
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.burbuja} ${esMio ? styles.burbujaPropia : styles.burbujaAjena}`}
                    >
                      {!esMio && (
                        <span className={styles.nombreRemitente}>
                          {msg.remitente_nombre} {msg.remitente_apellido}
                        </span>
                      )}
                      <p className={styles.textoMensaje}>{msg.contenido}</p>
                      <span className={styles.horaMensaje}>{formatearHora(msg.enviado_en)}</span>
                    </div>
                  )
                })
              )}
              <div ref={mensajesEndRef} />
            </div>

            {conversacionActual.estado === 'cerrada' ? (
              <div className={styles.convCerradaNotice}>
                <i className="fas fa-lock" />
                <span>Esta conversación fue cerrada. {rol === 'coordinador' ? 'Puedes reabrirla si es necesario.' : 'Contacta a tu coordinador para reabrirla.'}</span>
              </div>
            ) : (
              <div className={styles.inputArea}>
                <textarea
                  className={styles.textareaMensaje}
                  placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter nueva línea)"
                  value={textoMensaje}
                  onChange={e => setTextoMensaje(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={enviando}
                />
                <button
                  className={styles.btnEnviar}
                  onClick={enviarMensaje}
                  disabled={!textoMensaje.trim() || enviando}
                  title="Enviar"
                >
                  <i className={`fas ${enviando ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
