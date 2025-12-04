import { Router } from "express";
import { body } from "express-validator";
import { createAcount } from "./handlers";

const router = Router()

/**Autenticaion y Registro */
router.post('/auth/register',
    body('handle')
        .notEmpty()
        .withMessage('El handle no puede estar vacio'),
    body('name')
        .notEmpty()
        .withMessage('El nombre no puede estar vacio'),
    body('email')
        .isEmail()
        .withMessage('El email no es valido'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('El password debe tener al menos 8 caracteres'),
    createAcount)

export default router

