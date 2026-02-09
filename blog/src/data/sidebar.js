export const sidebarSections = [
  {
    title: "Main",
    items: [
      { label: "Home", icon: "home", isHome: true },
    ],
  },
  {
    title: "Resources",
    items: [
      { key: "template", label: "Template", icon: "book", href: "/blog/" },
      { key: "app", label: "App", icon: "grid", href: "/blog/" },
    ],
  },
];

export const iconPaths = {
  home: "M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5z",
  info: "M12 9.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5z M11 11h2v7h-2z",
  tag: "M4 7a3 3 0 0 1 3-3h5.6a2 2 0 0 1 1.4.6l5.4 5.4a2 2 0 0 1 0 2.8l-5.6 5.6a2 2 0 0 1-2.8 0L5.6 12.2A2 2 0 0 1 5 10.8V7z",
  mail: "M4 6h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2.2 8 5.2 8-5.2",
  book: "M5 4h11a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4z M7 6h9",
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  spark: "M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6L12 3z",
};
