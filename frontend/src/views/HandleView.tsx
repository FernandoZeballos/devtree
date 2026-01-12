import { Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUserByHandle } from "../api/DevTreeAPI";
import HandleData from "../components/HandleData";

export default function HandleView() {
  const params = useParams();
  const handle = params.handle!;
  const { data, isLoading, error } = useQuery({
    queryFn: () => getUserByHandle(handle),
    queryKey: ["handle", handle],
    retry: 1,
  });

  if (isLoading) return <p className="text-white text-center">Cargando...</p>;
  if (error) return <Navigate to="/404" />;

  if (data) return <HandleData data={data} />;
}
