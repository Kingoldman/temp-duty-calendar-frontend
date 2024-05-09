// 动态写入admin后台网址
import { config } from "./config.js";

let adminurlid = document.getElementById("adminurlid")
adminurlid.href = config.requesturl + "/admin";