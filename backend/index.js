import express from "express";
import mysql from "mysql2";
import cors from "cors";
import jwt from "jsonwebtoken";
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
const SECRET_KEY = "123";
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Генерация токена
  const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "7d" });

  const sql = "INSERT INTO users (`username`, `email`, `password`, `status`, `token`) VALUES (?)";
  const values = [username, email, password, "active", token];

  db.query(sql, [values], (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Email is already in use." });
      }
      console.error(err); // Вывод ошибки в консоль
      return res.status(500).json({ message: "Database error" });
    }
    return res.status(200).json({ message: "User registered successfully", token });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ Status: "Error", message: "Internal server error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ Status: "Error", message: "Invalid email or password" });
    }

    const user = result[0];

    // Проверка заблокированного статуса
    if (user.status === "blocked") {
      return res.status(403).json({ Status: "Error", message: "Account is blocked" });
    }

    // Генерация токена
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "7d" });

    res.status(200).json({
      Status: "Success",
      token,
      User: {
        id: user.id,
        email: user.email,
        status: user.status,
      },
    });

    updateLastLogin(user.id).catch((err) => console.error("Failed to update last login:", err));
  });
});

// Middleware для проверки токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user = user;
    next();
  });
};
app.post("/users/block", (req, res) => {
  const { ids, token } = req.body; // Ожидаем 'ids' и 'token' в теле запроса

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Invalid request. 'ids' must be a non-empty array." });
  }

  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  // Запрос к базе данных для получения пользователя по токену
  const sql = "SELECT id, token FROM users WHERE token = ?";
  db.query(sql, [token], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error." });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const currentUserId = result[0].id; // Получаем id пользователя из базы данных
    const currentUserToken = result[0].token; // Получаем токен из базы данных

    // Сравнение токенов
    if (token === currentUserToken) {
      console.log('Tokens match!'); // Выводим сообщение, если токены совпадают
    } else {
      console.log('Tokens do not match.');
    }

    // Проверка на попытку заблокировать самого себя
    if (ids.includes(currentUserId)) {
      return res.status(400).json({ message: "You cannot block your own account." });
    }

    // Блокировка пользователей в базе данных
    const blockSql = "UPDATE users SET status = 'blocked' WHERE id IN (?)";
    db.query(blockSql, [ids], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error." });
      }

      if (ids.includes(currentUserId)) {
        return res.status(200).json({ message: "You have been blocked. Logging you out." });
      }

      res.status(200).json({ message: `${result.affectedRows} users blocked successfully.` });
    });
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


  app.get("/users", authenticateToken, (req, res) => {
    const sql =
      "SELECT id, username AS name, email, last_login AS lastLogin, status FROM users ORDER BY last_login DESC";

    db.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).send("Internal server error");
      }

      res.json(result);
    });
  });
  app.post("/users/delete", authenticateToken, (req, res) => {
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

      // Проверка, если текущий пользователь был удалён
      if (ids.includes(req.user.id)) {
        return res.status(200).json({ message: "Your account has been deleted." });
      }

      // Сброс автоинкремента, если пользователей больше нет
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