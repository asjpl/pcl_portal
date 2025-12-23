import * as React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm",
        "outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100",
        props.className ?? ""
      ].join(" ")}
    />
  );
}
