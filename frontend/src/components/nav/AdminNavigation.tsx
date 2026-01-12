import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function AdminNavigation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    queryClient.invalidateQueries({ queryKey: ["user"] });
    navigate("/auth/login");
  };

  return (
    <button
      className=" bg-lime-500 p-2 text-slate-800 uppercase font-black text-xs rounded-lg cursor-pointer"
      onClick={logout}
    >
      Cerrar Sesión
    </button>
  );
}
