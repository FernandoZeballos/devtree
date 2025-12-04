import { Router } from "express";
import { createAcount } from "./handlers";

const router = Router()

/**Autenticaion y Registro */
router.post(`/auth/register`,createAcount)

export default router 

