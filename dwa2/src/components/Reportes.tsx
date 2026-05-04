import { useState, useMemo } from "react"
import styles from "./Reportes.module.css"

export interface ReporteItem {
  id: number
  [key: string]: unknown
}

interface ReportesProps {
  titulo: string
  columnas: Array<{
    clave: string
    etiqueta: string
    tipo?: "texto" | "numero" | "estado" | "porcentaje"
  }>
  datos: ReporteItem[]
  cargando?: boolean
  error?: string | null
  paginacion?: boolean
}

export const Reportes = ({
  titulo,
  columnas,
  datos,
  cargando = false,
  error = null,
  paginacion = false,
}: ReportesProps) => {
  const [paginaActual, setPaginaActual] = useState(1)
  const [busqueda, setBusqueda] = useState("")
  const [sortClave, setSortClave] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const itemsPorPagina = 10

  const handleSort = (clave: string) => {
    if (sortClave === clave) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortClave(clave)
      setSortDir("asc")
    }
    setPaginaActual(1)
  }

  const datosFiltrados = useMemo(() => {
    let resultado = [...datos]

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      resultado = resultado.filter((item) =>
        columnas.some((col) => String(item[col.clave] ?? "").toLowerCase().includes(q))
      )
    }

    if (sortClave) {
      resultado.sort((a, b) => {
        const va = a[sortClave]
        const vb = b[sortClave]
        const na = typeof va === "number" ? va : String(va ?? "").toLowerCase()
        const nb = typeof vb === "number" ? vb : String(vb ?? "").toLowerCase()
        if (na < nb) return sortDir === "asc" ? -1 : 1
        if (na > nb) return sortDir === "asc" ? 1 : -1
        return 0
      })
    }

    return resultado
  }, [datos, busqueda, sortClave, sortDir, columnas])

  const totalPaginas = Math.ceil(datosFiltrados.length / itemsPorPagina)
  const startIndex = (paginaActual - 1) * itemsPorPagina
  const endIndex = startIndex + itemsPorPagina
  const datosPaginados = datosFiltrados.slice(startIndex, endIndex)

  const renderValor = (valor: unknown, tipo: string = "texto") => {
    switch (tipo) {
      case "porcentaje":
        return `${String(valor ?? "-")}%`
      case "numero":
        return typeof valor === "number" ? valor.toLocaleString() : String(valor ?? "-")
      case "estado":
        return (
          <span className={valor === "Activo" || valor === "Aprobado" ? styles.estadoOk : styles.estadoBad}>
            {String(valor ?? "-")}
          </span>
        )
      default:
        return String(valor ?? "-")
    }
  }

  if (cargando) {
    return (
      <div className={styles.skeletonWrapper}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonTable}>
          <div className={styles.skeletonHeader}>
            {columnas.map((_, i) => (
              <div key={i} className={styles.skeletonHeaderCell} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              {columnas.map((_, j) => (
                <div key={j} className={styles.skeletonCell} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className={`${styles.statusBox} ${styles.statusBoxError}`}>Error: {error}</div>
  }

  if (datos.length === 0) {
    return (
      <div className={styles.statusBox}>
        No hay datos disponibles para {titulo.toLowerCase()}
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <h2 className={styles.title}>{titulo}</h2>
        <div className={styles.searchBox}>
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Buscar en resultados..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
            className={styles.searchInput}
          />
          {busqueda && (
            <button className={styles.clearBtn} onClick={() => { setBusqueda(""); setPaginaActual(1) }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      {busqueda && (
        <p className={styles.searchInfo}>
          {datosFiltrados.length} resultado{datosFiltrados.length !== 1 ? "s" : ""} para &quot;{busqueda}&quot;
        </p>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              {columnas.map((col) => (
                <th
                  key={col.clave}
                  className={`${styles.tableHeaderCell} ${styles.tableHeaderCellSortable}`}
                  onClick={() => handleSort(col.clave)}
                >
                  <span>{col.etiqueta}</span>
                  <span className={styles.sortIcon}>
                    {sortClave === col.clave
                      ? sortDir === "asc" ? " ↑" : " ↓"
                      : " ↕"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datosPaginados.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className={styles.noResults}>
                  Sin resultados para &quot;{busqueda}&quot;
                </td>
              </tr>
            ) : (
              datosPaginados.map((item, index) => (
                <tr key={item.id || index} className={styles.tableRow}>
                  {columnas.map((col) => (
                    <td key={col.clave} className={styles.tableCell}>
                      {renderValor(item[col.clave], col.tipo)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginacion && totalPaginas > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
            disabled={paginaActual === 1}
            className={styles.pageButton}
          >
            Anterior
          </button>

          {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
            const pageNum = Math.max(1, paginaActual - 2) + i
            if (pageNum > totalPaginas) return null
            return (
              <button
                key={pageNum}
                onClick={() => setPaginaActual(pageNum)}
                className={`${styles.pageButton} ${pageNum === paginaActual ? styles.pageButtonActive : ""}`}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
            disabled={paginaActual === totalPaginas}
            className={styles.pageButton}
          >
            Siguiente
          </button>
        </div>
      )}

      <div className={styles.footerNote}>
        Mostrando {datosFiltrados.length === 0 ? 0 : startIndex + 1} a {Math.min(endIndex, datosFiltrados.length)} de {datosFiltrados.length}{" "}
        {datosFiltrados.length !== datos.length && `(filtrado de ${datos.length} total)`}
      </div>
    </div>
  )
}
