// 日期处理
import { calendarJs } from "./calendar-js/calendarJs.js";
import { config } from "./config.js";

// 获得当前月份第一天是星期几,m是真实月份，获取星期数字，0代表星期日，1代表星期一，6代表星期六
export const get_firstday_the_week_by_ym = (y, m) => {
  return dayjs(`${y}-${m}`).startOf("month").day();
};

// 获取阳历月有几天，这里进来的m从1开始的真是月份
export const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

//获取下一个月,这里m是1开始真实月份名称
export const get_nextMonth_name = (y, m) => {
  const nextDate = dayjs(`$${y}-${m}`).add(1, "month");
  return [nextDate.year(), nextDate.month() + 1]; //只返回年月
};

export const get_lastMonth_name = (y, m) => {
  const lastDate = dayjs(`${y}-${m}`).subtract(1, "month");
  return [lastDate.year(), lastDate.month() + 1]; //只返回年月
};

// 每月7*6 数据,这里的month是真实的月份
export const cal_month_days = (cur_year, cur_month) => {
  // 当月天数
  const cur_days = getDaysInMonth(cur_year, cur_month);

  //上月和下月名称
  const [l_year, last_month] = get_lastMonth_name(cur_year, cur_month);
  const [n_year, next_month] = get_nextMonth_name(cur_year, cur_month);
  // 获得当前月份第一天是星期几
  let start = get_firstday_the_week_by_ym(cur_year, cur_month);

  if (start === 0) {
    start = 7; // 星期日要把0改成7
  }
  const next_month_fill = 42 - cur_days - start + 1; // 6行7列；下月天数填充本月

  const month_days_info = []; //月日历7*6个格子填充
  for (let i = 0; i < 42 - next_month_fill; i++) {
    // 填充上月天数
    if (i < start - 1) {
      /*cur_month: 'lastmonth',*/
      let month = last_month;
      let days = getDaysInMonth(l_year, last_month) - (start - 1) + i + 1;

      month_days_info.push(`${l_year}-${month}-${days}`);

      //本月
    } else if (i >= start - 1 && i < cur_days + start - 1) {
      /*cur_month: "curmonth",*/
      let month = cur_month;
      let days = i - start + 2;
      month_days_info.push(`${cur_year}-${month}-${days}`);
    }
  }
  //下月填充
  let nxtidx = 1;
  for (let i = start + cur_days - 1; i < 42; i++) {
    /*cur_month: "nextmonth"*/
    let month = next_month;
    let days = nxtidx;
    month_days_info.push(`${n_year}-${month}-${days}`);
    nxtidx += 1;
  }

  return month_days_info;
};

//  获取要显示的日期信息
export const infos = (y, m, d) => {
  let arr = [];
  cal_month_days(y, m, d).forEach((item) => {
    let obj = getDayInfo(...item.split("-"));
    obj.isselected =
      y == item.split("-")[0] &&
      m == item.split("-")[1] &&
      d == item.split("-")[2];

    obj.notthisMonth = m == item.split("-")[1];
    arr.push(obj);
  });
  return arr;
};

// 根据公历日期获取当天信息
export const getDayInfo = (y, m, d) => {
  let obj = calendarJs.solar2lunar(y, m, d);
  obj.isHolidays = isHoliday(y, m, d);
  // obj.iszqgqcj = is_zq_gq_cj(y, m, d);
  obj.isyuandan = isYuandan(y, m, d);
  obj.makeUpday = isMakeupDay(y, m, d);
  return obj;
};

// 是否元旦
export const isYuandan = (y, m, d) => {
  for (let i = 0; i < config.Exceptions.length; i++) {
    let year = parseInt(config.Exceptions[i].slice(0, 4));
    let month = parseInt(config.Exceptions[i].slice(4, 6));
    let day = parseInt(config.Exceptions[i].slice(6));
    if (y == year && m == month && day == d) {
      return true;
    }
  }
  return false;
};

// 是否法定节假日
export const isHoliday = (y, m, d) => {
  for (let i = 0; i < config.Holidays.length; i++) {
    let year = parseInt(config.Holidays[i].slice(0, 4));
    let month = parseInt(config.Holidays[i].slice(4, 6));
    let day = parseInt(config.Holidays[i].slice(6));
    if (y == year && m == month && day == d) {
      return true;
    }
  }
  return false;
};

// 是否补班
export const isMakeupDay = (y, m, d) => {
  for (let i = 0; i < config.MakeUpdays.length; i++) {
    let year = parseInt(config.MakeUpdays[i].slice(0, 4));
    let month = parseInt(config.MakeUpdays[i].slice(4, 6));
    let day = parseInt(config.MakeUpdays[i].slice(6));
    if (y == year && m == month && day == d) {
      return true;
    }
  }
  return false;
};
