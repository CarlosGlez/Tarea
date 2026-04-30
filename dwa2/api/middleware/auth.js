import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'siex2_super_secret_cambia_esto_en_produccion'

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token de acceso requerido' })
  }
  const token = authHeader.split(' ')[1]
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}
