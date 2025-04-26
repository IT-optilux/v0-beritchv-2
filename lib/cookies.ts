// lib/cookies.ts
import Cookies from "js-cookie";

// Guardar el token y el correo del usuario
export const saveUserSession = (token: string, email: string, uid: string) => {
  Cookies.set("authToken", token, { expires: 1 / 24 }); // 1 hora
  Cookies.set("userEmail", email, { expires: 1 / 24 }); // 1 hora
  Cookies.set("uid", uid, { expires: 1 / 24 }); // 1 hora
};

// Obtener el token y el correo del usuario
export const getUserSession = () => {
  const token = Cookies.get("authToken");
  const email = Cookies.get("userEmail");
  const uid = Cookies.get("uid");
  return { token, email, uid };
};

// Eliminar la sesión del usuario
export const removeUserSession = () => {
  Cookies.remove("authToken");
  Cookies.remove("userEmail");
  Cookies.remove("uid");
};
