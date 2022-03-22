import type { LinksFunction } from "remix";
import { Outlet } from "remix";

import stylesUrl from "~/styles/jokes.css";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: stylesUrl,
    },
  ];
};
export default function JokesRoute() {
  return (
    <div>
      <h1>J🤪kes</h1>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
