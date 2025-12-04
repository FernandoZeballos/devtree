import type{Request, Response} from 'express'
import User from "../models/User"
import { error } from 'console'
import {hashPassword} from "../utils/auth"



export const createAcount = async (req: Request, res: Response) => {
    const {email, password}= req.body

    const userExists = await User.findOne({email})
    if(userExists) {
        const error = new Error('EL usuario ya esta registrado')
        return res.status(409).json({error: error.message})
    }
    
    const user = new User(req.body)
    user.password = await hashPassword(password)
    await user.save()
    res.send('Registro creado Correctamente')
}