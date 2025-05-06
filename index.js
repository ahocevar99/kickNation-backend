import express from "express";
import { PORT } from "./config.js";
import router from "./router/routes.js";
import * as path from "path";
import { fileURLToPath } from 'url';
import { mongoDBURL } from "./config.js";
import mongoose from "mongoose";
import cors from 'cors'
import cookieParser from 'cookie-parser'
import cron from 'node-cron';
import { startTournament, eighthFinals, quarterFinals, semiFinals, final, getDailyMoney } from "./gameLogic.js";
import { addPlayerToDB, checkNumberOfPlayersInDB } from "./functions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

mongoose.connect(mongoDBURL)
    .then(() => {
        console.log("Connected to database")
        app.listen(PORT, () => {
            console.log(`App is listening on port ${PORT}`);
        })
    })
    .catch((error) => {
        console.log(error)
    })

app.set("views", path.join(__dirname, "hbs", "views"));
app.set("view engine", "hbs");
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    exposedHeaders: 'Authorization',
}))
app.use(cookieParser())
app.use("/", router)
app.use(express.urlencoded({ extended: true }));

cron.schedule('14 17 * * 0-6', async () => {
    try {
        console.log('Creating new tournament ...');
        await getDailyMoney();
        await startTournament();
        console.log('Playing the eighth finals ...');
        await eighthFinals();
    } catch (error) {
        console.error('Error creating new tournament', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Ljubljana'
});

cron.schedule('16 17 * * 0-6', async () => {
    try {
        console.log('Playing the quarter finals ...');
        await quarterFinals();
    } catch (error) {
        console.error('Error creating new tournament', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Ljubljana'
});

cron.schedule('17 17 * * 0-6', async () => {
    try {
        console.log('Playing the semi finals ...');
        await semiFinals();
    } catch (error) {
        console.error('Error creating new tournament', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Ljubljana'
});

cron.schedule('18 17 * * 0-6', async () => {
    try {
        console.log('Playing the final ...');
        await final();
    } catch (error) {
        console.error('Error creating new tournament', error);
    }
}, {
    scheduled: true,
    timezone: 'Europe/Ljubljana'
});



cron.schedule('*/3 * * * * *', async () => {
    if (await checkNumberOfPlayersInDB() < 1000) {
        await addPlayerToDB();
    }
    else {

    }
}, {
    scheduled: true,
    timezone: 'Europe/Ljubljana'
});





