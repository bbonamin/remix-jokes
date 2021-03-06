import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  useCatch,
  useTransition,
} from "remix";
import { useActionData, redirect, json } from "remix";
import { JokeDisplay } from "~/components/joke";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

const validateJokeContent = function (content: string) {
  if (content.length < 10) {
    return `That joke is too short!`;
  }
};

const validateJokeName = function (name: string) {
  if (name.length < 3) {
    return `That joke's name is too short!`;
  }
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    content: string | undefined;
  };
  fields?: {
    name: string;
    content: string;
  };
};

const badRequest = (data: ActionData) => {
  return json(data, { status: 400 });
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized!", { status: 401 });
  }
  return json({});
};
export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const name = formData.get("name");
  const content = formData.get("content");

  if (typeof name !== "string" || typeof content !== "string") {
    return badRequest({
      formError: `Form not submitted correctly`,
    });
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  };

  const fields = { name, content, jokesterId: userId };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const joke = await db.joke.create({
    data: fields,
  });

  return redirect(`/jokes/${joke.id}`);
};

export default function JokesNewRoute() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();

  if (transition.submission) {
    const formData = transition.submission.formData;
    const name = formData.get("name");
    const content = formData.get("content");
    if (
      typeof name === "string" &&
      typeof content === "string" &&
      !validateJokeContent(content) &&
      !validateJokeName(name)
    ) {
      return (
        <JokeDisplay
          joke={{ name, content }}
          isOwner={true}
          canDelete={false}
        />
      );
    }
  }
  return (
    <div>
      <p>Add your own hilarious joke</p>
      <Form method="post">
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-errormessage={
                Boolean(actionData?.fieldErrors?.name)
                  ? "name-error"
                  : undefined
              }
              name="name"
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p className="form-validation-error" role="alert" id="name-error">
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Content:{" "}
            <textarea
              defaultValue={actionData?.fields?.content}
              name="content"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.content) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.content ? "content-error" : undefined
              }
            />
          </label>
          {actionData?.fieldErrors?.content ? (
            <p
              className="form-validation-error"
              role="alert"
              id="content-error"
            >
              {actionData.fieldErrors.content}
            </p>
          ) : null}
        </div>
        <div>
          {actionData?.formError ? (
            <p className="form-validation-error" role="alert">
              {actionData.formError}
            </p>
          ) : null}
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be signed in to create a Joke</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
}
