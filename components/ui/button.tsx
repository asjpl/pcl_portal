import Link from "next/link";

type Props =
  | ({ href: string; variant?: "solid" | "ghost" } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined; variant?: "solid" | "ghost" } & React.ButtonHTMLAttributes<HTMLButtonElement>);

export function Button(props: Props) {
  const variant = (props as any).variant ?? "solid";
  const base =
    variant === "ghost"
      ? "rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
      : "rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800";

  if ("href" in props && props.href) {
    const { href, className, ...rest } = props;
    return <Link href={href} className={[base, className ?? ""].join(" ")} {...rest} />;
  }

  const { className, ...rest } = props as any;
  return <button className={[base, className ?? ""].join(" ")} {...rest} />;
}
