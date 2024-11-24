import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Ilya20040208",
  database: "db",
});

const updateLastLogin = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE users SET last_login = NOW() WHERE id = ?";
    db.query(sql, [userId], (err) => {
      if (err) {
        console.error("Error updating last login:", err);
        return reject(err);
      }
      resolve();
    });
  });
};

app.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    const sql = "INSERT INTO users (`username`, `email`, `password`, `status`) VALUES (?)";
    const values = [username, email, password, 'active', new Date()];

    db.query(sql, [values], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email is already in use." });
        }
        return res.status(500).json({ message: "Database error" });
      }
      return res.status(200).json({ message: "User registered successfully" });
    });
  });

app.post("/users/block", (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid request. 'ids' must be a non-empty array." });
    }

    const sql = "UPDATE users SET status = 'blocked' WHERE id IN (?)";

    db.query(sql, [ids], (err, result) => {
      if (err) {
        console.error("Error blocking users:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.status(200).json({ message: `${result.affectedRows} users blocked successfully.` });
    });
  });

  app.post("/users/unblock", (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid request. 'ids' must be a non-empty array." });
    }

    const sql = `UPDATE users SET status = 'active' WHERE id IN (?)`;

    db.query(sql, [ids], (err, result) => {
      if (err) {
        console.error("Error unblocking users:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      res.status(200).json({ message: `${result.affectedRows} users unblocked successfully.` });
    });
  });

  app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], async (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ Error: "Database query error" });
      }

      if (result.length > 0) {
        const user = result[0];

        if (user.status === "blocked") {
          return res.status(403).json({ Error: "Your account is blocked. Please contact support." });
        }

        if (password === user.password) {
          try {
            await updateLastLogin(user.id);
            return res.json({ Status: "Success", userId: user.id });
          } catch (updateErr) {
            console.error("Error updating last login:", updateErr);
            return res.status(500).json({ Error: "Error updating last login" });
          }
        } else {
          return res.status(401).json({ Error: "Wrong password" });
        }
      } else {
        return res.status(404).json({ Error: "Email not registered" });
      }
    });
  });

app.get("/users", (req, res) => {
    const sql = "SELECT id, username AS name, email, last_login AS lastLogin, status FROM users ORDER BY last_login DESC";

    db.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).send("Internal server error");
      }

      res.json(result);
    });
  });

app.post("/users/delete", (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid request. 'ids' must be a non-empty array." });
    }

    const deleteSql = "DELETE FROM users WHERE id IN (?)";
    const resetAutoIncrementSql = "ALTER TABLE users AUTO_INCREMENT = 1";

    db.query(deleteSql, [ids], (err, result) => {
      if (err) {
        console.error("Error deleting users:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      db.query("SELECT COUNT(*) AS count FROM users", (err, rows) => {
        if (err) {
          console.error("Error checking user count:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        if (rows[0].count === 0) {
          db.query(resetAutoIncrementSql, (err) => {
            if (err) {
              console.error("Error resetting AUTO_INCREMENT:", err);
              return res.status(500).json({ message: "Internal server error" });
            }
          });
        }
      });

      res.status(200).json({ message: `${result.affectedRows} users deleted successfully.` });
    });
  });

app.listen(8081, () => {
  console.log("Server is running on port 8081");
});