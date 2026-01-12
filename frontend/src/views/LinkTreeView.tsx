import { useState } from "react";
import { social } from "../data/social";
import DevTreeInput from "../components/DevTreeInput";
import { isValidUrl } from "../utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../api/DevTreeAPI";
import type { User, SocialNetwork } from "../types";

export default function LinkTreeView() {
  const queryClient = useQueryClient();
  const user: User = queryClient.getQueryData(["user"])!;

  const [devTreeLinks, setDevTreeLinks] = useState<SocialNetwork[]>(() => {
    const userLinks = user.links ? JSON.parse(user.links) : [];
    const updatedData = social.map((item) => {
      const userlink = userLinks.find(
        (link: SocialNetwork) => link.name === item.name
      );
      if (userlink) {
        return {
          ...item,
          url: userlink.url,
          enabled: userlink.enabled,
          id: userlink.id,
        };
      }
      return { ...item, id: 0 };
    });
    return updatedData;
  });

  const { mutate } = useMutation({
    mutationFn: updateProfile,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Actualizado correctamente");
    },
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updatedLinks = devTreeLinks.map((link) =>
      link.name === e.target.name ? { ...link, url: e.target.value } : link
    );
    setDevTreeLinks(updatedLinks);
  };

  const handleEnableLink = (socialNetwork: string) => {
    const updatedLinks = devTreeLinks.map((link) => {
      if (link.name === socialNetwork) {
        if (isValidUrl(link.url)) {
          return { ...link, enabled: !link.enabled };
        } else {
          toast.error("URL no valida");
        }
      }
      return link;
    });

    // setDevTreeLinks(updatedLinks); // REMOVED: Waiting for re-indexing logic below

    let updatedItems: SocialNetwork[] = [];
    const selectedLink = updatedLinks.find(
      (link) => link.name === socialNetwork
    );

    if (selectedLink?.enabled) {
      const id = updatedLinks.filter((link) => link.enabled).length - 1;
      updatedItems = updatedLinks.map((link) => {
        if (link.name === socialNetwork) {
          return { ...link, id, enabled: true };
        } else {
          return link;
        }
      });
    } else {
      updatedItems = updatedLinks.map((link) => {
        if (link.name === socialNetwork) {
          return { ...link, id: 0, enabled: false };
        } else if (
          link.id > selectedLink!.id && // If link.id is undefined, it's 0 likely
          link.enabled
        ) {
          return { ...link, id: link.id - 1 };
        } else {
          return link;
        }
      });
    }

    queryClient.setQueryData(["user"], (prevData: User) => {
      return {
        ...prevData,
        links: JSON.stringify(updatedItems),
      };
    });

    setDevTreeLinks(updatedItems);
  };

  return (
    <>
      <div className="space-y-5">
        {devTreeLinks.map((item) => (
          <DevTreeInput
            key={item.name}
            item={item}
            handleUrlChange={handleUrlChange}
            handleEnableLink={handleEnableLink}
          />
        ))}

        <button
          className="bg-cyan-400 p-2 text-lg w-full uppercase text-slate-600 rounded-lg font-bold"
          onClick={() =>
            mutate({
              ...user,
              links: JSON.stringify(devTreeLinks),
            })
          }
        >
          Guardar Cambios
        </button>
      </div>
    </>
  );
}
