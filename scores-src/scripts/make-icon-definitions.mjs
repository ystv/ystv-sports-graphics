import * as fs from "fs";
import * as path from "path";

const icons = fs
  .readdirSync(
    path.join("..", "node_modules", "tabler-icons-react", "dist", "icons")
  )
  .map((x) => x.replace(/\.js$/, ""));

const definitions = icons.map(
  (icon) => `declare module "tabler-icons-react/dist/icons/${icon}";`
);

fs.writeFileSync(
  path.join("src", "client", "icons.d.ts"),
  definitions.join("\n")
);
