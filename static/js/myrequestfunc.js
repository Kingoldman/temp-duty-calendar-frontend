// 请求函数
import { urlrequest } from "./UrlRequest.js";
import { config } from "./config.js";
import { endloading } from "./otherutils.js";

//找上个月的指针数据等这个月用
export const requestDataFunc = async (l_year, last_month) => {
  try {
    const res2list = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/normaldutyinfo_bymonth`,
      {
        params: {
          date: `${l_year}-${last_month}-1`, //找上个月默认1日的数据。
        },
      }
    );

    let res2 = {};
    //res2list可能为[{...},{...}...]多个或为空[]，//找其中created_at时间最晚的作为最终数据
    if (res2list.length > 0) {
      res2 = [...res2list].sort((a, b) => b.created_at - a.created_at)[0];
    }

    let holiday_full_pointer = 0;
    let last_holiday_not_use = [];
    let normal_full_pointer = 0;
    let leader_normal_pointer = 0;
    let leader_holiday_pointer = 0;
    let last_normal_not_use = [];
    let thismonthduty_db = [];
    let thismonthduty_db_leader = [];
    if (Object.keys(res2).length > 0) {
      holiday_full_pointer = res2["holiday_full_pointer"];
      last_holiday_not_use = res2["last_holiday_not_use"];
      normal_full_pointer = res2["normal_full_pointer"];
      last_normal_not_use = res2["last_normal_not_use"];
      (leader_normal_pointer = res2["leader_normal_pointer"]),
        (leader_holiday_pointer = res2["leader_holiday_pointer"]),
        (thismonthduty_db = res2["thismonthduty_db"]),
        (thismonthduty_db_leader = res2["thismonthduty_db_leader"]);
    }

    return [
      holiday_full_pointer,
      last_holiday_not_use,
      //zqgqcj_full_pointer,
      //last_zqgqcj_not_use,
      normal_full_pointer,
      last_normal_not_use,
      leader_holiday_pointer,
      leader_normal_pointer,
      thismonthduty_db,
      thismonthduty_db_leader,
    ]; //这个其实是上个月的值班详情，因为请求的是上个月的数据
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//原始人员
export const requestoriginpersons = async () => {
  let res = [];
  try {
    res = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/dutypersons`,
      {}
    );
  } catch (error) {
    console.log("error", error);
    throw error;
  }
  //console.log("origin", res);
  //return res.filter((item) => item['duty_type'] !== "N");
  return res;
};

//原始领导
export const requestleaderdutyers = async (ish = true) => {
  let res = [];
  try {
    res = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/leaderdutyers`,
      {}
    );
  } catch (error) {
    console.log("error", error);
    throw error;
  }
  //console.log("origin", res);
  //return res.filter((item) => item['duty_type'] !== "N");
  if (!ish) {
    //如果不是節假日，需要排除主要
    return res.filter((item) => item["normal_number"] > 0);
  }
  return res;
};

//请求curdate值班人员
export const everymonthdutyerqueue = async (curdate) => {
  let res;
  try {
    res = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/everymonthdutyerqueue`,
      {
        params: {
          date: curdate,
        },
      }
    );
  } catch (error) {
    console.log("error", error);
    throw error;
  }

  if (res.length > 0) {
    const dutyerqueue = JSON.parse(res[0]["dutyerqueue"]);
    const leader_dutyerqueue = JSON.parse(res[0]["leader_dutyerqueue"]);
    return [dutyerqueue, leader_dutyerqueue];
  } else {
    return [[], []];
  }
};




//请求alldate值班人员
export const all_dutyerqueue = async () => {
  let res;
  try {
    res = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/everymonthdutyerqueue`,
      {}
    );
  } catch (error) {
    console.log("error", error);
    throw error;
  }

  return res;
};



// 值班安排。1.先拉取数据原始人员信息（主要为了获取值班次数）。2.post到值班安排
export const post_everymonthdutyerqueue = async (year, month) => {
  const token = localStorage.getItem("token");
  if (token) {
    let originpersons = await requestoriginpersons();
    let leaderdutyers = await requestleaderdutyers();

    const authorizationheaders = { Authorization: `Bearer ${token}` };
    let res = "";
    try {
      res = await urlrequest.post(
        `${config.requesturl}/api/dutycalendar/everymonthdutyerqueue`,
        {
          params: {
            date: `${year}-${month}-1`,
          },
          data: {
            date: `${year}-${month}-1`,
            dutyerqueue: JSON.stringify(originpersons), //把数组转成字符串
            leader_dutyerqueue: JSON.stringify(leaderdutyers),
          },
        },
        authorizationheaders
      );
    } catch (error) {
      console.log("error:", error);
      throw error;
    }
    // console.log(res); // {detail: 'Unauthorized'}、 {id: 93}
    return res;
  } else {
    endloading(); //这里结束一下加载中模态框，不然无法登录
    return {"detail": 'Unauthorized'};
  }
};

//请求curdate存在数据库中值班数据
export const requestthismonthduty = async (curdate) => {
  let res = [];
  try {
    res = await urlrequest.get(
      `${config.requesturl}/api/dutycalendar/normaldutyinfo_bymonth`,
      {
        params: {
          date: curdate,
        },
      }
    );
  } catch (error) {
    console.log("error", error);
    throw error;
  }

  if (res.length > 0) {
    return [res[0]]; //按照created_at倒序排的，第一个就是最近的吧。。。。还是返回一个数组
  } else {
    return res;
  }
};

//排完班把数据post到数据库
export const postdatatodb = async (
  year,
  month,
  holiday_full_pointer,
  this_holiday_not_use,
  normal_full_pointer,
  this_normal_not_use,
  leader_normal_pointer,
  leader_holiday_pointer,
  thismonthduty,
  thismonthduty_leader
) => {
  const token = localStorage.getItem("token");
  if (token) {
    const authorizationheaders = { Authorization: `Bearer ${token}` };
    try {
      const res = await urlrequest.post(
        `${config.requesturl}/api/dutycalendar/normaldutyinfo_bymonth`,
        {
          params: {
            date: `${year}-${month}-1`,
          },
          data: {
            date: `${year}-${month}-1`,
            created_at: Date.now(),
            holiday_full_pointer: holiday_full_pointer,
            last_holiday_not_use: this_holiday_not_use,
            //zqgqcj_full_pointer: zqgqcj_full_pointer,
            //last_zqgqcj_not_use: this_zqgqcj_not_use,
            normal_full_pointer: normal_full_pointer,
            last_normal_not_use: this_normal_not_use,
            leader_normal_pointer: leader_normal_pointer,
            leader_holiday_pointer: leader_holiday_pointer,
            thismonthduty_db: JSON.stringify(thismonthduty), //把数组转成字符串
            thismonthduty_db_leader: JSON.stringify(thismonthduty_leader),
          },
        },
        authorizationheaders
      );
    } catch (e) {
      if (e instanceof DOMException) {
        console.log("DOMException error:", e); //dom加载失败，重新加载
        setTimeout(function () {}, 1000);
      } else {
        console.log("Other error:", e);
      }
      throw e;
    }
  } else {
    alert("没有管理员权限，排班结果提交数据库失败！");
    endloading(); //这里结束一下加载中模态框，不然无法登录
  }
};
