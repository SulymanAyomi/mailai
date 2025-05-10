import { api } from "@/trpc/react";
import { getQueryKey } from "@trpc/react-query";
import { atom, useAtom } from "jotai";
import React from "react";
import { useLocalStorage } from "usehooks-ts";

export const openMailAtom = atom<"new" | "close" | "reply">("close");
const openNewMail = () => {

    const [openMail, setOpenMail] = useAtom(openMailAtom);


    return {
        openMail,
        setOpenMail
    };
};

export default openNewMail;
