export let constant = {
  curyear: new Date().getFullYear(), // 获取年份
  curmonth: new Date().getMonth() + 1, // 获取月份，需要加1，因为月份是以0开始计数的
  curday: new Date().getDate(),

  weekname: [
    //['日','一','二','三','四','五','六','七']
    "\u65e5",
    "\u4e00",
    "\u4e8c",
    "\u4e09",
    "\u56db",
    "\u4e94",
    "\u516d",
    "\u4e03",
  ],

  monthStr: [
    "一",
    "二",
    "三",
    "四",
    "五",
    "六",
    "七",
    "八",
    "九",
    "十",
    "十一",
    "十二",
  ],

  //年选项
  start_year: 1900,
  end_year: 2300,

  // 顶位置
  bangongshi: {
    id: 2,
    normal_number: 666,
    holiday_number: 666,
    name: "办公室",
    gender: "M",
    phone: "49*****26",
    duty_type: "N",
    total_duty_count: 0,
    holiday_duty_count: 0,
    normal_duty_count: 0,
    day_shift_count: 0,
    night_shift_count: 0,
  },
};
