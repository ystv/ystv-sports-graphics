import invariant from "tiny-invariant";
import type { NodeCG } from "../../../../../types/server";
import { Configschema } from "./types/config";

function trailingSlash(str: string): string {
  if (str[str.length - 1] === "/") {
    return str;
  }
  return str + "/";
}

export function getAttachmentURL(id: string, serverNCG?: NodeCG): string {
  const cfg = (serverNCG || nodecg).bundleConfig as Configschema;
  invariant(cfg.scoresService, "no scores service configured");

  return trailingSlash(cfg.scoresService.publicAttachmentsURLBase) + id;
}
