import {
  json,
  Link,
  LoaderFunction,
  useCatch,
  useLoaderData,
  useParams,
} from "remix";
import { db } from "~/utils/db.server";

import { Prisma } from "@prisma/client";

type JokeWithJokester = Prisma.JokeGetPayload<{ include: { jokester: true } }>;
type LoaderData = { joke: JokeWithJokester };

export const loader: LoaderFunction = async ({ params }) => {
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
    include: { jokester: true },
  });
  if (!joke) throw new Response("Joke not found!", { status: 404 });

  const data: LoaderData = { joke };

  return json(data);
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data.joke.content}</p>
      <p>Author: {data.joke.jokester.username}</p>
      <Link to=".">{data.joke.name} Permalink</Link>
    </div>
  );
}

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className="error-container">
      {`Error loading joke with id ${jokeId}`}
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  if (caught.status === 404) {
    return (
      <div className="error-container"> Huh? What is "{params.jokeId}"</div>
    );
  }
  throw new Error(`Unhandler error: ${caught.status}`);
}
