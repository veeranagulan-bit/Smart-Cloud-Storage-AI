export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · Smart Cloud Storage AI` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · Smart Cloud Storage AI` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
