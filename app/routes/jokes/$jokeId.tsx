import {
  Form,
  json,
  Link,
  redirect,
  useCatch,
  useLoaderData,
  useParams,
} from "remix";
import { db } from "~/utils/db.server";

import { Prisma } from "@prisma/client";
import { requireUserId } from "~/utils/session.server";
import type { LoaderFunction, ActionFunction } from "remix";

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

// export const action: ActionFunction = async ({ request }) => {
//   // const userId = await getUserId(request);
//   // const data = useLoaderData<LoaderData>();
//   // console.log(data);
//   // const formData = await request.formData();
// };

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();
  if (form.get("_method") !== "delete") {
    throw new Response(`The _method ${form.get("_method")} is not supported`, {
      status: 400,
    });
  }
  const userId = await requireUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });
  if (!joke) {
    throw new Response("Can't delete what does not exist", {
      status: 404,
    });
  }
  if (joke.jokesterId !== userId) {
    throw new Response("Pssh, nice try. That's not your joke", {
      status: 401,
    });
  }
  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect("/jokes");
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();
  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data.joke.content}</p>
      <p>Author: {data.joke.jokester.username}</p>
      <Link to=".">{data.joke.name} Permalink</Link>
      <Form method="post">
        <input type="hidden" name="_method" value="delete" />
        <button type="submit">Delete</button>
      </Form>
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
  switch (caught.status) {
    case 400: {
      return (
        <div className="error-container">
          What you're trying to do is not allowed.
        </div>
      );
    }
    case 404: {
      return (
        <div className="error-container">
          Huh? What the heck is {params.jokeId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.jokeId} is not your joke.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}
