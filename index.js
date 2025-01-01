const mysql = require("mysql2/promise");
const { exec } = require("child_process");
// const archiver = require("archiver");
// const { ZipFile } = require('zip-lib');
const fs = require("fs");
const TelegramBot = require("node-telegram-bot-api");
require('dotenv').config();

let date = new Date().toLocaleDateString().replaceAll(',','').replaceAll('/','-').replaceAll(':','_')
let backUpFileName = `backup-${date}.zip`
console.log(date)
console.log(backUpFileName)

// Telegram sozlamalari
const BOT_TOKEN = process.env.BOT_TOKEN
const TG_USER_ID = process.env.TG_USER_ID
const password = process.env.ZIP_PASSWORD // Zip fayl uchun parol

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// MySQL sozlamalari
const dbConfig = {
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD ,
};

// Backup papka
const backupDir = "./backups";
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

// Ma'lumotlar bazalarini olish
const getDatabases = async () => {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.query("SHOW DATABASES");
  await connection.end();

  // Tizim bazalarini olib tashlash
  return rows
    .map(row => row.Database)
    .filter(db => !["information_schema", "mysql", "performance_schema", "sys"].includes(db));
};

// Ma'lumotlar bazasini zaxiralash
const backupDatabase = (database) => {
  return new Promise((resolve, reject) => {
    const fileName = `${backupDir}/${database}.sql`;
    const dumpCommand = `mysqldump -u ${dbConfig.user} -p${dbConfig.password} ${database} > ${fileName}`;
    exec(dumpCommand, (err) => {
      if (err) return reject(err);
      resolve(fileName);
    });
  });
};

// Arxiv yaratish  -- BU pasrolsiz yaratish qismi
const createArchive = (files) => {
  return new Promise((resolve, reject) => {
    const zipPath = `${backupDir}/${backUpFileName}`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    files.forEach(file => archive.file(file, { name: file.split("/").pop() }));
    archive.finalize();
  });
};

// Zip faylni yaratish va parol bilan himoya qilish  (-- Only installed 7-Zip and added Path)
const createArchiveWithPassword = (files) => {
  return new Promise((resolve, reject) => {
    const zipPath = `${backupDir}/${backUpFileName}`;

    // 7zip orqali zip yaratish va parol qo'yish
    const command = `7z a -p${password} ${zipPath} ${files.join(' ')}`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error("Error creating zip with password:", stderr);
        return reject(err);
      }
      console.log("Archive created successfully!");
      resolve(zipPath);
    });
  });
};

// Zaxirani Telegramga yuborish
const sendToTelegram = async (zipPath) => {
  try {
    await bot.sendDocument(TG_USER_ID, zipPath, { caption: "📦 Daily MySQL Backup" });
    console.log("Backup sent to Telegram successfully!");
  } catch (error) {
    console.error("Failed to send backup to Telegram:", "error");
  }
};

// Tozalash jarayoni
const cleanUp = (files) => {
  files.forEach(file => fs.unlinkSync(file));
};

// Asosiy funksiya
const runBackup1 = async () => {
  try {
    console.log("Getting databases...");
    const databases = await getDatabases();

    console.log("Backing up databases...");
    const backupFiles = [];
    for (const db of databases) {
      const backupFile = await backupDatabase(db);
      backupFiles.push(backupFile);
    }

    console.log("Creating archive...");
    const zipPath = await createArchiveWithPassword(backupFiles);

    console.log("Sending to Telegram...");
    await sendToTelegram(zipPath);

    console.log("Cleaning up...");
    cleanUp([...backupFiles, zipPath]);

    console.log("Backup process completed successfully!");
  } catch (error) {
    console.error("Error during backup process:", error);
  }
};

const runBackup = async () => {
  try {
    // Har bir backup jarayonida yangi sana va fayl nomini yaratish
    let date = new Date().toLocaleDateString().replaceAll(',', '').replaceAll('/', '-').replaceAll(':', '_');
    let backUpFileName = `backup-${date}.zip`;
    console.log(date);
    console.log(backUpFileName);

    console.log("Getting databases...");
    const databases = await getDatabases();

    console.log("Backing up databases...");
    const backupFiles = [];
    for (const db of databases) {
      const backupFile = await backupDatabase(db);
      backupFiles.push(backupFile);
    }

    console.log("Creating archive...");
    const zipPath = await createArchiveWithPassword(backupFiles);

    console.log("Sending to Telegram...");
    await sendToTelegram(zipPath);

    console.log("Cleaning up...");
    cleanUp([...backupFiles, zipPath]);

    console.log("Backup process completed successfully!");
  } catch (error) {
    console.error("Error during backup process:", error);
  }
};


// Har 24 soatda avtomatik ishlashi uchun interval
setInterval(runBackup, 24 * 60 * 60 * 1000); // 24 soat
runBackup(); // Birinchi marta ishga tushirish
