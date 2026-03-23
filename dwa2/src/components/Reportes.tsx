import { useState } from "react"
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
  const itemsPorPagina = 10
  const totalPaginas = Math.ceil(datos.length / itemsPorPagina)

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

  const startIndex = (paginaActual - 1) * itemsPorPagina
  const endIndex = startIndex + itemsPorPagina
  const datosPaginados = datos.slice(startIndex, endIndex)

  if (cargando) {
    return <div className={styles.statusBox}>Cargando {titulo.toLowerCase()}...</div>
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
      <h2 className={styles.title}>{titulo}</h2>

      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            {columnas.map((col) => (
              <th key={col.clave} className={styles.tableHeaderCell}>
                {col.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datosPaginados.map((item, index) => (
            <tr key={item.id || index} className={styles.tableRow}>
              {columnas.map((col) => (
                <td key={col.clave} className={styles.tableCell}>
                  {renderValor(item[col.clave], col.tipo)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

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
        Mostrando {startIndex + 1} a {Math.min(endIndex, datos.length)} de {datos.length}{" "}
        registros
      </div>
    </div>
  )
}
