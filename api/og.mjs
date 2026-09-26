// FILE: api/og.mjs
import { ImageResponse } from "@vercel/og";
import React from "react";

export const config = { runtime: "edge" };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "Product";
  const price = searchParams.get("price") || "";
  const image = searchParams.get("image") || "";

  const el = React.createElement(
    "div",
    {
      style: {
        width: "1080px",
        height: "1080px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        backgroundColor: "#0b0b0c",
        backgroundImage: image ? `url(${image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      },
    },
    React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(11,11,12,0) 45%, rgba(11,11,12,0.95) 100%)",
        display: "flex",
      },
    }),
    React.createElement(
      "div",
      { style: { position: "relative", padding: "60px", display: "flex", flexDirection: "column" } },
      React.createElement(
        "div",
        { style: { fontSize: 52, color: "#fff", fontWeight: 600, marginBottom: 20, display: "flex" } },
        name,
      ),
      React.createElement(
        "div",
        { style: { fontSize: 88, color: "#fff", fontWeight: 800, display: "flex" } },
        price,
      ),
    ),
  );

  return new ImageResponse(el, { width: 1080, height: 1080 });
}