const express = require("express");
const cors = require("cors");
const { initDb, dbPath } = require("./db");
const { registerReportRoutes } = require("./reports");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

registerReportRoutes(app);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
      console.log(`SQLite database: ${dbPath}`);
    });
  })
  .catch((err) => {
    console.error("Failed to open the database", err);
    process.exit(1);
  });
