import { render } from "./calendardom.js";

import { add_bind_func, into_func } from "./addbindfunc.js";

render(".container"); // 1. 渲染

await add_bind_func(); // 2. 增加日历基础功能之外的绑定功能
// await into_func();
