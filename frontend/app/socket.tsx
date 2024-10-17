"use client";

import { io } from "socket.io-client";

export const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_HOST}`, {
    path: `${process.env.NEXT_PUBLIC_SOCKET_PATH}/socket.io`,
    // query: {
    //   token: Props.token,
    //   embedType: 'openai'
    // },
});