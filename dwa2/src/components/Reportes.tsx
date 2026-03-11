import { useState } from "react"

export interface ReporteItem {
  id: number
  [key: string]: any
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

  const renderValor = (valor: any, tipo: string = "texto") => {
    switch (tipo) {
      case "porcentaje":
        return `${valor}%`
      case "numero":
        return valor.toLocaleString()
      case "estado":
        return (
          <span
            style={{
              color: valor === "Activo" || valor === "Aprobado" ? "#4caf50" : "#f44336",
              fontWeight: "600",
            }}
          >
            {valor}
          </span>
        )
      default:
        return valor
    }
  }

  const startIndex = (paginaActual - 1) * itemsPorPagina
  const endIndex = startIndex + itemsPorPagina
  const datosPaginados = datos.slice(startIndex, endIndex)

  if (cargando) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Cargando {titulo.toLowerCase()}...</div>
  }

  if (error) {
    return <div style={{ padding: "20px", color: "#f44336" }}>Error: {error}</div>
  }

  if (datos.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        No hay datos disponibles para {titulo.toLowerCase()}
      </div>
    )
  }

  return (
    <div>
      <h2>{titulo}</h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          fontSize: "14px",
        }}
      >
        <thead
          style={{
            backgroundColor: "#f9f9f9",
            borderBottom: "2px solid #ff5800",
          }}
        >
          <tr>
            {columnas.map((col) => (
              <th
                key={col.clave}
                style={{
                  padding: "15px",
                  textAlign: "left",
                  color: "#ff5800",
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                {col.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datosPaginados.map((item, index) => (
            <tr
              key={item.id || index}
              style={{
                borderBottom: "1px solid #e0e0e0",
                "&:hover": { backgroundColor: "#f9f9f9" },
              }}
            >
              {columnas.map((col) => (
                <td
                  key={col.clave}
                  style={{
                    padding: "15px",
                    color: "#666",
                  }}
                >
                  {renderValor(item[col.clave], col.tipo)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {paginacion && totalPaginas > 1 && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <button
            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
            disabled={paginaActual === 1}
            style={{
              padding: "8px 12px",
              cursor: paginaActual === 1 ? "not-allowed" : "pointer",
              opacity: paginaActual === 1 ? 0.5 : 1,
            }}
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
                style={{
                  padding: "8px 12px",
                  backgroundColor: pageNum === paginaActual ? "#ff5800" : "#e0e0e0",
                  color: pageNum === paginaActual ? "white" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
            disabled={paginaActual === totalPaginas}
            style={{
              padding: "8px 12px",
              cursor: paginaActual === totalPaginas ? "not-allowed" : "pointer",
              opacity: paginaActual === totalPaginas ? 0.5 : 1,
            }}
          >
            Siguiente
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: "15px",
          fontSize: "12px",
          color: "#999",
          textAlign: "right",
        }}
      >
        Mostrando {startIndex + 1} a {Math.min(endIndex, datos.length)} de {datos.length}{" "}
        registros
      </div>
    </div>
  )
}
