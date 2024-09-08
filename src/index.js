import dotenv from "dotenv"
import { ConnectDB } from "./config/db.js";
import { app } from "./app.js";

dotenv.config({
    path:'./.env'
})

ConnectDB()
.then(()=>{
    app.listen(process.env.PORT||7000, console.log(`Listening on ${process.env.PORT||7000}...`));
})
.catch(err=>{console.log(err)});