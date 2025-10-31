// src/lib/friends.js
import { api } from "../lib/api";

// --- Solicitações ---
export const sendFriendRequest = (nickname, tag) =>
  api.post("/friends/requests", { friend_nickname: nickname, friend_tag: tag });

// src/lib/friends.js
export const listFriendRequests = async () => {
  const data = (await api.get("/friends/requests")).data || {};

  const norm = (r, kind) => {
    const id = r.id ?? r._id ?? r.request_id;

    // candidatos para quem envia
    const fromNick = r.from_nickname ?? r.sender_nickname ?? r.requester_nickname ?? r.fromNick ?? (r.from && String(r.from).split("#")[0]);
    const fromTag  = r.from_tag      ?? r.sender_tag      ?? r.requester_tag      ?? r.fromTag  ?? (r.from && String(r.from).split("#")[1]);

    // candidatos para quem recebe
    const toNick = r.to_nickname ?? r.target_nickname ?? r.friend_nickname ?? r.toNick ?? (r.to && String(r.to).split("#")[0]);
    const toTag  = r.to_tag      ?? r.target_tag      ?? r.friend_tag      ?? r.toTag  ?? (r.to && String(r.to).split("#")[1]);

    // strings completas (fallbacks)
    const from = r.from ?? (fromNick && fromTag ? `${fromNick}#${fromTag}` : undefined);
    const to   = r.to   ?? (toNick  && toTag  ? `${toNick}#${toTag}`   : undefined);

    // para o card, “amigo” é:
    // - incoming: quem TE convidou (from)
    // - outgoing: quem você convidou (to)
    const friend_nickname = (kind === "incoming") ? fromNick : toNick;
    const friend_tag      = (kind === "incoming") ? fromTag  : toTag;

    return { ...r, id, from, to, friend_nickname, friend_tag };
  };

  return {
    incoming: (data.incoming || data.received || []).map(r => norm(r, "incoming")),
    outgoing: (data.outgoing || data.sent     || []).map(r => norm(r, "outgoing")),
  };
};


export const acceptFriendRequest = (requestId) =>
  api.post(`/friends/requests/${requestId}/accept`);

export const rejectFriendRequest = (requestId) =>
  api.post(`/friends/requests/${requestId}/reject`);

// --- Amigos + presença ---
// >>> AGORA usando a rota nova
export const getFriendsPresence = () =>
  api.get("/friends/list").then(r => r.data);

// --- Presença ---
export const presenceOpen  = () => api.post("/presence/open",  {}, { withCredentials: true });
export const presencePing  = (active=false) => api.post("/presence/ping",  { active }, { withCredentials: true });
export const presenceLeave = () => api.post("/presence/leave", {}, { withCredentials: true });

// Timer do usuário atual (para o backend saber seu estado)
export const setTimerState = (state, seconds_left = null) =>
  api.post("/study/timer/state", { state, seconds_left });
