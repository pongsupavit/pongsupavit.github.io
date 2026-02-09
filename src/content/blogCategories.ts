export interface BlogCategory {
  name: string;
  type: "blog" | "app" | "template";
  icon: string;
  color: "purple" | "blue" | "green" | "yellow" | "red" | "grey";
  section: string;
}

export const blogCategories: BlogCategory[] = [
  {
    name: "Technology",
    type: "blog",
    icon: "rocket_launch",
    color: "purple",
    section: "Article"
  },
  {
    name: "Productivity Hack",
    type: "blog",
    icon: "schedule",
    color: "blue",
    section: "Article"
  },
  {
    name: "Finance",
    type: "blog",
    icon: "paid",
    color: "green",
    section: "Article"
  },
  {
    name: "Lifestyle",
    type: "blog",
    icon: "favorite",
    color: "yellow",
    section: "Article"
  },
  {
    name: "Travel",
    type: "blog",
    icon: "travel",
    color: "red",
    section: "Article"
  },
  {
    name: "App",
    type: "app",
    icon: "desktop_windows",
    color: "grey",
    section: "Free Stuff"
  },
  {
    name: "Template",
    type: "template",
    icon: "article",
    color: "grey",
    section: "Free Stuff"
  }
];
