"use client";

import { adler32, crc32, md5 } from "@/lib/hashes";

/**
 * Web Worker client with automatic main-thread fallback.
 * Heavy crypto/text workloads run off the UI thread; if Workers are
 * unavailable the same operations degrade gracefully to main-thread.
 */

export type HashAlgo = "md5" | "sha-1" | "sha-256" | "sha-512" | "crc32" | "adler32";

type Pending = {
  resolve: (value: string) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
let workerFailed = false;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (workerFailed) return null;
  if (worker) return worker;
  if (typeof Worker === "undefined") return null;
  try {
    worker = new Worker("/workers/ops.worker.js");
    worker.onmessage = (e: MessageEvent) => {
      const { id, result, error } = e.data as {
        id: number;
        result?: string;
        error?: string;
      };
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (error) p.reject(new Error(error));
      else p.resolve(result ?? "");
    };
    worker.onerror = () => {
      workerFailed = true;
      for (const p of pending.values()) {
        p.reject(new Error("Worker error"));
      }
      pending.clear();
    };
  } catch {
    workerFailed = true;
    return null;
  }
  return worker;
}

function runInWorker(algo: HashAlgo, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    if (!w) {
      reject(new Error("Worker unavailable"));
      return;
    }
    const id = nextId++;
    pending.set(id, { resolve, reject });
    w.postMessage({ id, op: "hash", algo, text: input });
  });
}

async function hashMainThread(algo: HashAlgo, input: string): Promise<string> {
  switch (algo) {
    case "md5":
      return md5(input);
    case "crc32":
      return crc32(input);
    case "adler32":
      return adler32(input);
    default: {
      if (typeof crypto === "undefined" || !crypto.subtle) {
        throw new Error("WebCrypto is unavailable in this context");
      }
      const digestName =
        algo === "sha-1" ? "SHA-1" : algo === "sha-256" ? "SHA-256" : "SHA-512";
      const data = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest(digestName, data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  }
}

export async function hashText(algo: HashAlgo, input: string): Promise<string> {
  try {
    return await runInWorker(algo, input);
  } catch {
    return hashMainThread(algo, input);
  }
}
