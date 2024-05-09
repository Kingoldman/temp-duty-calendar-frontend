// 日历dom操作等
import { constant } from "./constant.js";

import {
  cell_row_start,
  cell_row_end,
  cell_1_5,
  cell_6_7,
  year_select_start,
  year_select_end,
  month_select_start,
  month_select_end,
  year_month_select_start,
  year_month_select_end,
  time_switch,
  manage_zhiban,
  other_dom,
} from "./domfragmt.js";

import { makeDuty } from "./calendaralg.js";

import { infos } from "./dateclass.js";



export const getdom = (item) => {
  let leader_name = item.children[1].children[0].children[1].children[0];
  let leader_tel = item.children[1].children[0].children[1].children[1];

  //白班1号
  let d_p_1_name = item.children[1].children[1].children[1].children[0];
  let d_p_1_tel = item.children[1].children[1].children[1].children[1];
  //白班2号
  let d_p_2_name = item.children[1].children[1].children[2].children[0];
  let d_p_2_tel = item.children[1].children[1].children[2].children[1];
  //晚班1号
  let e_p_1_name = item.children[1].children[2].children[1].children[0];
  let e_p_1_tel = item.children[1].children[2].children[1].children[1];
  //晚班2号
  let e_p_2_name = item.children[1].children[2].children[2].children[0];
  let e_p_2_tel = item.children[1].children[2].children[2].children[1];

  return {
    leader_name,
    leader_tel,
    //白班1号
    d_p_1_name,
    d_p_1_tel,
    //白班2号
    d_p_2_name,
    d_p_2_tel,
    //晚班1号
    e_p_1_name,
    e_p_1_tel,
    //晚班2号
    e_p_2_name,
    e_p_2_tel,
  };
};

export const initdomdata = (
  leader_name,
  leader_tel,
  d_p_1_name,
  d_p_1_tel,
  d_p_2_name,
  d_p_2_tel,
  e_p_1_name,
  e_p_1_tel,
  e_p_2_name,
  e_p_2_tel
) => {
  //非排班日期的全部清空
  leader_name.innerHTML = "领导";
  leader_tel.innerHTML = "0123456";

  //白班1号
  d_p_1_name.innerHTML = "某某某";
  d_p_1_tel.innerHTML = "01234567890";
  //白班2号
  d_p_2_name.innerHTML = "某某某";
  d_p_2_tel.innerHTML = "01234567890";
  //晚班1号
  e_p_1_name.innerHTML = "某某某";
  e_p_1_tel.innerHTML = "01234567890";
  //晚班2号
  e_p_2_name.innerHTML = "某某某";
  e_p_2_tel.innerHTML = "01234567890";
};

// 标题星期一至星期日
export const render_weeks = () => {
  let html = "";
  for (let i = 1; i <= 7; i++) {
    html += `<div class="calendar-header-item">${
      constant.weekname[i % 7]
    }</div>`;
  }
  return `<div class="calendar-left-header  py-3">${html}</div>`;
};

export const render_dom = (el) => {
  //月选项
  let mhtml = "",
    yhtml = "";
  //十二个月
  for (let i = 1; i <= 12; i++) {
    let text = constant.monthStr[i - 1];
    mhtml += `<option value="${i}">${text}月</option>`;
  }

  //年选项
  for (let i = constant.start_year; i <= constant.end_year; i++) {
    yhtml += `<option value="${i}">${i}年</option>`;
  }

  //日期面板
  let rows = "";
  for (let row = 1; row <= 6; row++) {
    //日期每一行
    rows += cell_row_start;
    //周一至周五
    for (let col = 1; col <= 5; col++) {
      rows += cell_1_5;
    }

    //周末
    for (let col = 6; col <= 7; col++) {
      rows += cell_6_7;
    }
    rows += cell_row_end;
  }

  let html =
    `
      <div class="calendar-left">
        
        <div class="calendar-toolbar-top border-bottom"> 
       ` +
    year_month_select_start +
    year_select_start +
    `${yhtml}` +
    year_select_end +
    month_select_start +
    `${mhtml}` +
    month_select_end +
    year_month_select_end +
    time_switch +
    manage_zhiban +
    other_dom +
    `</div>
        ${render_weeks()}
        <div class="calendar-left-main equalwidth">${rows}</div>
      </div>`;

  el.innerHTML = html;
};

//  传入select Dom和值动态改变select当前选中状态
const setSelect = (el, val) => {
  for (let i = 0; i < el.options.length; i++) {
    if (el.options[i].value === val) el.options[i].selected = true;
  }
};

//设置要显示到左侧表格中的数据，数据改变时更新界面
/*1将传入的数组赋值给实例的showArr属性，用于右侧日程列表的显示。2遍历日历中的每个日期格子，根据传入的数组中对应的元素，更新格子的显示内容和样式。3如果传入的数组中有某个元素表示的日期不属于当前月份，则将下拉框中的年份和月份设置为该日期所在的年份和月份。4如果传入的数组中有某个元素表示的日期被选中，则将该元素赋值给实例的dayInfo属性，用于右侧日程列表的显示。5根据传入的数组中每个元素的属性，更新对应日期格子的样式，包括是否为节假日、是否为补班日、是否为今天、是否被选中、是否不属于当前月份等。6将每个日期格子的日期信息和样式更新到DOM中。7最后，调用makeDuty方法，用于排班。*/

let monthinfo; // 设置一个全局的当前月的信息记录变量
const mainInfo = (arr) => {
  // arr当前月的数据
  monthinfo = arr[6].date; // 第6个是第一排最后一个，肯定有数据，这个用来切上月，下月

  let status = false; // 设置 select 修改状态
  //showArr = arr; // 右边显示
  const cells = document.querySelectorAll(
    ".calendar-left-main .calendar-main-col"
  );

  cells.forEach((item, index) => {
    const {
      notthisMonth,
      date,
      isselected,
      isToday,
      festival,
      lunarFestival,
      Term,
      IDayCn,
      makeUpday,
    } = arr[index];

    if (!status && notthisMonth) {
      status = true;
      setSelect(
        document.querySelector(".select-year select"),
        date.slice(0, 4)
      );
      setSelect(
        document.querySelector(".select-month select"),
        date.split("-")[1]
      );
    }
    let dayInfo;
    isselected ? (dayInfo = arr[index]) : ""; //这里给选中日信息赋值
    const t_classList = [];
    if (arr[index].isHolidays) t_classList.push("isHolidays");
    if (arr[index].isyuandan) t_classList.push("isyuandan");
    if (makeUpday) t_classList.push("makeUpday");
    if (isToday) t_classList.push("isToday");
    if (isselected) t_classList.push("isselected");
    if (!notthisMonth) t_classList.push("notthisMonth");

    // 优先显示顺序公立节假日 农历假日 节气 农历
    const info = festival || lunarFestival || Term || IDayCn;

    item.classList.remove(
      "isHolidays",
      "isyuandan",
      "makeUpday",
      "isToday",
      "isselected",
      "notthisMonth"
    );

    item.classList.add(...t_classList);

    item.setAttribute("date", date); //这里给每天加一个属性
    item.querySelector(".calendar-col-day-info .yl").innerHTML =
      date.split("-")[2];
    item.querySelector(".calendar-col-day-info .other-info").innerHTML = info;
  });

  // 这里排班
  makeDuty(cells);
};

//  给工具按钮以及单元格绑定点击事件
const bind = (el) => {
  // 返回本月，已经是今天则不绑定
  el.querySelector(".back-today").addEventListener("click", () => {
    let [y, m, d] = monthinfo.split("-");
    y = parseInt(y);
    m = parseInt(m);
    if (y === constant.curyear && m === constant.curmonth) return;
    mainInfo(infos(constant.curyear, constant.curmonth, constant.curday));
  });

  // 选择年份
  let ybtn = el.querySelector(".select-year select");
  let mbtn = el.querySelector(".select-month select");
  ybtn.addEventListener("change", () => {
    mainInfo(
      infos(
        ybtn.value,
        mbtn.value,
        1 // 这里直接给个1号
      )
    );
  });

  // 选择月份
  mbtn.addEventListener("change", () => {
    mainInfo(
      infos(
        ybtn.value,
        mbtn.value,
        1 // 这里直接给个1号
      )
    );
  });

  // 上一月
  el.querySelector(".last-month").addEventListener("click", () => {
    let [y, m, d] = monthinfo.split("-");
    y = parseInt(y);
    m = parseInt(m);
    d = 1;

    //23年四月之前不给切了
    if ((y === 2023 && m <= 5) || y < 2023) {
      return;
    }

    if (m === 1) {
      m = 12;
      y--;
    } else {
      m--;
    }
    mainInfo(infos(y, m, d));
    return;
  });

  // 下一月
  el.querySelector(".next-month").addEventListener("click", () => {
    let [y, m, d] = monthinfo.split("-");
    y = parseInt(y);
    m = parseInt(m);
    d = 1;

    if (m === 12) {
      m = 1;
      y++;
    } else {
      m++;
    }

    mainInfo(infos(y, m, d));
    return;
  });

  /**绑定每个日期格子的点击事件，当用户点击某个日期格子时，如果该格子不属于当前月份，则重新渲染日历；否则，将该格子标记为选中状态，并更新右侧的日程列表。 */
  let td = el.querySelectorAll(".calendar-main-col");
  td.forEach((item) => {
    item.addEventListener("click", () => {
      let date = item.getAttribute("date");
      if (item.classList.contains("notthisMonth")) {
        mainInfo(infos(...date.split("-")));
      } else {
        td.forEach((list) => {
          list.classList.remove("isselected");
        }); //删除之前的选中
        item.classList.add("isselected");
      }
    });
  });
};


 // 渲染
 export const render = (element) => {
  const el = document.querySelector(element);
  // 建立dom
  render_dom(el);
  // 绑定动作
  bind(el);
  // 渲染数据
  mainInfo (infos(constant.curyear, constant.curmonth, constant.curday));
};
