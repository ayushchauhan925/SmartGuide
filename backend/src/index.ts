import "dotenv/config"; // must be first: other modules read process.env at import time
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = parseInt(process.env.PORT ?? "4000", 10);

const server = createApp().listen(PORT, () => {
  console.log(`SmartGuide API listening on http://localhost:${PORT}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
