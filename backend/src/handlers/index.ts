import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import slug from "slug";
import formidable from "formidable";
import { v4 as uuid } from "uuid";
import User from "../models/User";
import { hashPassword, checkPassword } from "../utils/auth";
import { generateJWT } from "../utils/jwt";
import cloudinary from "../config/cloudinary";

export const createAcount = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error("Un usuario con ese e-mail ya esta registrado");
    return res.status(409).json({ error: error.message });
  }

  const handle = slug(req.body.handle, "");
  const handleExists = await User.findOne({ handle });
  if (handleExists) {
    const error = new Error("El nombre de usuario no disponible");
    return res.status(409).json({ error: error.message });
  }

  const user = new User(req.body);
  user.password = await hashPassword(password);
  user.handle = handle;

  await user.save();
  res.status(201).send("Usuario creado correctamente");
};

export const login = async (req: Request, res: Response) => {
  //Manejar errores
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;

  //revisar si el usuario esta registrado
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("El usuario no existe");
    return res.status(404).json({ error: error.message });
  }

  //comparar contraseñas
  const isPasswordCorrect = await checkPassword(password, user.password);
  if (!isPasswordCorrect) {
    const error = new Error("Contraseña incorrecta");
    return res.status(401).json({ error: error.message });
  }

  const token = generateJWT({ id: user._id });

  res.send(token);
};

export const getUser = async (req: Request, res: Response) => {
  res.json(req.user);
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { description, links } = req.body;

    if (!req.user) {
      const error = new Error("No Autorizado");
      return res.status(401).json({ error: error.message });
    }
    const handle = slug(req.body.handle, "");
    const handleExists = await User.findOne({ handle });
    if (handleExists && handleExists.email !== req.user.email) {
      const error = new Error("El nombre de usuario no disponible");
      return res.status(409).json({ error: error.message });
    }

    //Actualizar el Usuario
    req.user.description = description;
    req.user.handle = handle;
    req.user.links = links;
    await req.user.save();
    res.send("Perfil Actualizado Correctamente");
  } catch (e) {
    const error = new Error("Hubo un Error");
    return res.status(500).json({ error: error.message });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  const form = formidable({ multiples: false });

  try {
    form.parse(req, (error, fields, files) => {
      if (error) {
        return res.status(500).json({ error: "Error parsing form data" });
      }

      if (!files.file) {
        return res.status(400).json({ error: "La imagen es obligatoria" });
      }

      cloudinary.uploader.upload(
        files.file[0].filepath,
        { public_id: uuid() },
        async function (error, result) {
          if (error) {
            const errorMsg = new Error("Error al subir la imagen a Cloudinary");
            return res.status(500).json({ error: errorMsg.message });
          }
          if (result) {
            if (req.user) {
              req.user.image = result.secure_url;
              await req.user.save();
              res.json({ image: result.secure_url });
            } else {
              return res
                .status(500)
                .json({ error: "Error al subir la imagen" });
            }
          }
        }
      );
    });
  } catch (e) {
    const error = new Error("Hubo un Error");
    return res.status(500).json({ error: error.message });
  }
};

export const getUserByHandle = async (req: Request, res: Response) => {
  try {
    const { handle } = req.params;
    const user = await User.findOne({ handle }).select(
      "-_id -__v -email -password"
    );
    if (!user) {
      const error = new Error("El usuario no existe");
      return res.status(404).json({ error: error.message });
    }

    res.json(user);
  } catch (e) {
    const error = new Error("Hubo un Error");
    return res.status(500).json({ error: error.message });
  }
};
