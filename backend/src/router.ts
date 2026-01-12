import { Router } from "express";
import { body } from "express-validator";
import {
  createAcount,
  getUser,
  getUserByHandle,
  login,
  searchByHandle,
  updateProfile,
  uploadImage,
} from "./handlers";
import { handleInputErrors } from "./middleware/validation";
import { authenticate } from "./middleware/auth";

const router = Router();

/**Autenticaion y Registro */
router.post(
  "/auth/register",
  body("handle").notEmpty().withMessage("El handle no puede estar vacio"),
  body("name").notEmpty().withMessage("El nombre no puede estar vacio"),
  body("email").isEmail().withMessage("El email no es valido"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("El password debe tener al menos 8 caracteres"),
  handleInputErrors,
  createAcount
);
router.post(
  "/auth/login",
  body("email").isEmail().withMessage("El email no es valido"),
  body("password").notEmpty().withMessage("El password es Obligatorio"),
  handleInputErrors,
  login
);

router.get("/user", authenticate, getUser);
router.patch(
  "/user",
  body("handle").notEmpty().withMessage("El handle no puede estar vacio"),

  handleInputErrors,
  authenticate,
  updateProfile
);

router.post("/user/image", authenticate, uploadImage);

router.get("/:handle", getUserByHandle);

router.post(
  "/search",
  body("handle").notEmpty().withMessage("El handle no puede estar vacio"),
  handleInputErrors,
  //authenticate,
  searchByHandle
);

export default router;
