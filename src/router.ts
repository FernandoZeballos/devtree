import { Router } from "express";
import { body } from "express-validator";
import { createAcount, login } from "./handlers";
import { handleInputErrors } from "./middleware/validation";

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
    handleInputErrors,
    createAcount
)
router.post('/auth/login',
    body('email')
        .isEmail()
        .withMessage('El email no es valido'),
    body('password')
        .notEmpty()
        .withMessage('El password es Obligatorio'),
    handleInputErrors,
    login)


export default router

