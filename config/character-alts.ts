// Player-confirmed relationships; never infer ownership from a shared name.
const naisen = { id: "forever-eu-naisen-grandwell", name: "Naisen Grandwell" };
const loqe = { id: "forever-eu-loqe-delabahía", name: "Loqe Delabahía" };
const olynn = { id: "forever-eu-olynn-grandwell", name: "Olynn Grandwell" };

export const characterAlts: Partial<Record<string, { id: string; name: string }>> = {
  "forever-eu-naisen-nightray": naisen,
  "forever-eu-aloqes-dloqe": loqe,
  "forever-eu-maister-grandwell": olynn,
  "forever-eu-laister-grandwell": olynn,
  "forever-eu-lyrae-grandwell": olynn,
};
