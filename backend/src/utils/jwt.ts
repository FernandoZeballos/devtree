
import jwt, { JwtPayload } from 'jsonwebtoken'

export const generateJWT = (payload: JwtPayload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: '180d'
    })
    return token
}
