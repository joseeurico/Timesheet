"use client";

import type { FormEvent } from "react";

export function DeleteCrButton({
  id,
  action,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Delete this CR record permanently?")) {
      event.preventDefault();
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
      >
        Delete
      </button>
    </form>
  );
}
