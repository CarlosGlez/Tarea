import 'dotenv/config'
import mysql from 'mysql2'

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'siex2',
  port: Number(process.env.DB_PORT) || 3306,
})

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err)
  } else {
    console.log('✅ Conectado a MySQL (SIEX2)')
    connection.release()
  }
})

export default db
