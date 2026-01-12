import { useQueryClient } from "@tanstack/react-query";
import QRCode from "react-qr-code";
import type { User } from "../types";

export default function QRCodeView() {
  const queryClient = useQueryClient();
  const user: User = queryClient.getQueryData(["user"])!;

  const publicUrl = `${window.location.origin}/${user.handle}`;

  return (
    <div className="bg-white p-10 rounded-lg space-y-5 text-center">
      <h2 className="text-2xl font-black text-slate-800">
        Comparte tu Código QR
      </h2>
      <p className="text-lg text-slate-600">
        Escanea este código para visitar tu perfil
      </p>

      <div className="flex justify-center border-2 border-dashed border-gray-300 p-10 rounded-xl bg-gray-50">
        <QRCode value={publicUrl} size={256} />
      </div>

      <div className="mt-5">
        <p className="text-sm text-gray-400">
          Enlace: <span className="text-gray-600 font-bold">{publicUrl}</span>
        </p>
      </div>
    </div>
  );
}
