import { Link, Outlet } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useMutation } from "@tanstack/react-query";
import NavigationTabs from "./NavigationTabs";
import type { SocialNetwork, User } from "../types";
import { useState } from "react";
import DevTreeLink from "./DevTreeLink";
import { updateProfile } from "../api/DevTreeAPI";
import Header from "./Header";

type DevTreeProps = {
  data: User;
};

export default function DevTree({ data }: DevTreeProps) {
  const [enabledLinks, setEnabledLinks] = useState<SocialNetwork[]>(
    JSON.parse(data.links)
      .filter((item: SocialNetwork) => item.enabled)
      .sort((a: SocialNetwork, b: SocialNetwork) => a.id - b.id)
  );

  // Use a previous state variable to track changes in data.links
  // This avoids the cascading render caused by useEffect
  const [prevLinks, setPrevLinks] = useState(data.links);

  // This pattern is recommended by React docs for deriving state from props
  // It triggers an immediate re-render before the browser paints
  if (data.links !== prevLinks) {
    setEnabledLinks(
      JSON.parse(data.links)
        .filter((item: SocialNetwork) => item.enabled)
        .sort((a: SocialNetwork, b: SocialNetwork) => a.id - b.id)
    );
    setPrevLinks(data.links);
  }

  const { mutate } = useMutation({
    mutationFn: updateProfile,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success("Orden Actualizado");
    },
  });

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && over.id !== active.id) {
      const oldIndex = enabledLinks.findIndex((link) => link.id === active.id);
      const newIndex = enabledLinks.findIndex((link) => link.id === over.id);
      const order = arrayMove(enabledLinks, oldIndex, newIndex);

      const newOrder = order.map((link, index) => {
        return {
          ...link,
          id: index,
        };
      });

      setEnabledLinks(newOrder);

      const disabledLinks: SocialNetwork[] = JSON.parse(data.links).filter(
        (item: SocialNetwork) => !item.enabled
      );

      const links = [...newOrder, ...disabledLinks];

      mutate({ ...data, links: JSON.stringify(links) });
    }

    console.log(e.active);
    console.log(e.over);
  };

  return (
    <>
      <Header />

      <div className="bg-gray-100  min-h-screen py-10">
        <main className="mx-auto max-w-5xl p-10 md:p-0">
          <NavigationTabs />

          <div className="flex justify-end">
            <Link
              className="font-bold text-right text-slate-800 text-2xl"
              to={`/${data.handle}`}
            >
              Visitar Mi Perfil: /{data.handle}
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-10 mt-10">
            <div className="flex-1 ">
              <Outlet />
            </div>
            <div className="w-full md:w-96 bg-slate-800 px-5 py-10 space-y-6">
              <p className="text-4xl text-center text-white">{data.handle}</p>

              {data.image && (
                <img
                  src={data.image}
                  alt="Imagen Perfil"
                  className="mx-auto max-w-[250px]"
                  key={data.image}
                />
              )}

              <p className="text-center text-lg font-black text-white">
                {data.description}
              </p>

              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="mt-20 flex flex-col gap-5">
                  <SortableContext
                    items={enabledLinks}
                    strategy={verticalListSortingStrategy}
                  >
                    {enabledLinks.map((link) => (
                      <DevTreeLink key={link.name} link={link} />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
            </div>
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
