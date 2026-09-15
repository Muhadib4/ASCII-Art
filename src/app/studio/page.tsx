import { Suspense } from "react";
import type { Metadata } from "next";
import Editor from "@/features/editor/Editor";

export const metadata: Metadata = { title: "Studio — ASCII Creative Studio", description: "Your browser is an ASCII art studio. Turn images, words, and photos into character art, compose a poster, and export your creation." };

export default function StudioPage() {
  return <Suspense fallback={<main className="studio-boot" aria-label="Opening ASCII studio"><pre aria-hidden="true">[ ░░▒▒▓▓██ ]</pre><p>OPENING YOUR STUDIO</p></main>}><Editor /></Suspense>;
}
