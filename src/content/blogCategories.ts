export interface BlogCategory {
  name: string;
  color: "blue" | "green" | "red" | "purple" | "yellow";
  icon: string;
}

export const blogCategories: BlogCategory[] = [
  {
    name: "Technology",
    color: "blue",
    icon: "rocket_launch"
  },
  {
    name: "Productivity Hack",
    color: "green",
    icon: "schedule"
  },
  {
    name: "Finance",
    color: "red",
    icon: "paid"
  },
  {
    name: "Lifestyle",
    color: "purple",
    icon: "favorite"
  },
  {
    name: "Travel",
    color: "yellow",
    icon: "travel"
  }
];
