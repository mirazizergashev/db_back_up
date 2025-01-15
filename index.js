const mysql = require("mysql2/promise");
const { exec } = require("child_process");
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
require('dotenv').config();

// Telegram sozlamalari
const BOT_TOKEN = process.env.BOT_TOKEN;
const TG_USER_ID = process.env.TG_USER_ID;
const password = process.env.ZIP_PASSWORD;

// Backup papka
const backupDir = "./backups";
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

// Ma'lumotlar bazalarini olish
const getDatabases = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  const [rows] = await connection.query("SHOW DATABASES");
  await connection.end();
  return rows
    .map(row => row.Database)
    .filter(db => !["information_schema", "mysql", "performance_schema", "sys"].includes(db));
};

// Ma'lumotlar bazasini zaxiralash
const backupDatabase = (database) => {
  return new Promise((resolve, reject) => {
    const fileName = `${backupDir}/${database}.sql`;
    const dumpCommand = `mysqldump -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${database} > ${fileName}`;
    exec(dumpCommand, (err) => {
      if (err) return reject(err);
      resolve(fileName);
    });
  });
};

// Zip faylni yaratish va parol bilan himoya qilish
const createArchiveWithPassword = (files, backUpFileName) => {
  return new Promise((resolve, reject) => {
    const zipPath = `${backupDir}/${backUpFileName}`;
    const command = `7z a -p${password} ${zipPath} ${files.join(' ')}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Error creating zip with password:", stderr);
        return reject(err);
      }
      resolve(zipPath);
    });
  });
};

// Zaxirani Telegramga yuborish
const sendToTelegram = async (zipPath) => {
  try {
    const bot = new TelegramBot(BOT_TOKEN, { polling: false });
    await bot.sendDocument(TG_USER_ID, zipPath, { caption: "📦 Daily MySQL Backup" });
  } catch (error) {
    console.error("Failed to send backup to Telegram:", error);
  }
};

// Tozalash jarayoni
const cleanUp = (files) => {
  files.forEach(file => fs.unlinkSync(file));
};

// Zaxiralash jarayonini ishga tushirish
const runBackup = async () => {
  try {
    let date = new Date().toLocaleDateString().replaceAll(',', '').replaceAll('/', '-').replaceAll(':', '_');
    let backUpFileName = `backup-${date}.zip`;
    console.log(`Backup started: ${date}`);

    const databases = await getDatabases();
    const backupFiles = [];
    for (const db of databases) {
      const backupFile = await backupDatabase(db);
      backupFiles.push(backupFile);
    }

    const zipPath = await createArchiveWithPassword(backupFiles, backUpFileName);
    await sendToTelegram(zipPath);
    cleanUp([...backupFiles, zipPath]);

    console.log("Backup completed successfully!");
  } catch (error) {
    console.error("Error during backup process:", error);
  }
};

runBackup();
