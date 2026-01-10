import type { Middleware } from "@reduxjs/toolkit";
import { schemaMiddleware } from "./schema";

export const jmixMiddlewares: Middleware[] = [schemaMiddleware];

