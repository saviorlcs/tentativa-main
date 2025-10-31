function ensureLink() {
  let link = document.querySelector("link#dynamic-favicon[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.id = "dynamic-favicon";
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

export function setFavicon(mode = "idle") {
  const map = {
    study: { bg: "#0B1020", emoji: "🔴" },
    break: { bg: "#0B1020", emoji: "☕" },
    idle:  { bg: "#0B1020", emoji: "🟦" },
  };
  const { bg, emoji } = map[mode] || map.idle;

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
       <rect width='100%' height='100%' rx='12' ry='12' fill='${bg}'/>
       <text x='50%' y='56%' text-anchor='middle' dominant-baseline='middle'
             font-size='44'>${emoji}</text>
     </svg>`;

  const link = ensureLink();
  link.href = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
