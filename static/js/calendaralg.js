// 排班算法类
import { config } from "./config.js";
import { constant } from "./constant.js";
import { get_lastMonth_name } from "./dateclass.js";
import { urlrequest } from "./UrlRequest.js";
import { getdom, initdomdata } from "./calendardom.js";

import { chuli_phone, displayloading, endloading } from "./otherutils.js";

import {
  requestDataFunc,
  requestoriginpersons,
  requestleaderdutyers,
  everymonthdutyerqueue,
  requestthismonthduty,
  postdatatodb,
} from "./myrequestfunc.js";

let duty_cache = {}; //缓存得请求到的数据{date:{all_duty_list,duty_all_len,holiday_full_pointer等}
let havethisdb = false; //标记数据库是否有当月数据，这个要全局，每次初始化

/*//修正_full_pointer。这里有个问题，如果上个月在_full_pointer之前增加人员，那么这个月请求到的
    all_dutyer_list在不修正_full_pointer位置的值肯定不正确，指针需要向前移动人员数量找到正确的起始位置
    ；而如果在指针之后加入人员则不受影响；其次如果减少人员，也不会影响，因为目前采取不删除人员，而是把人员
    的type改为N*/
export const correct_full_pointer = (
  last_duty_list,
  this_duty_list,
  _pointer
) => {
  //如果上月没有数据，不做修正
  if (last_duty_list.length === 0) {
    return _pointer;
  }
  const last_json = JSON.stringify(
    last_duty_list[_pointer]["name"] +
      last_duty_list[_pointer]["gender"] +
      last_duty_list[_pointer]["id"]
  ); // 对象不能直接比较

  let res = _pointer;
  for (let i = 0; i < this_duty_list.length; i++) {
    if (
      JSON.stringify(
        this_duty_list[i]["name"] +
          this_duty_list[i]["gender"] +
          this_duty_list[i]["id"]
      ) === last_json
    ) {
      res = i;
      break;
    }
  }
  return res;
};

//排完班后按月进行缓存
export const make_cache = (
  year,
  month,
  all_duty_list,
  leaderdutyers,
  holiday_full_pointer,
  this_holiday_not_use,
  normal_full_pointer,
  this_normal_not_use,
  leader_normal_pointer,
  leader_holiday_pointer,
  thismonthduty,
  thismonthduty_leader
) => {
  if (
    !duty_cache.hasOwnProperty(`${year}-${month}-1`) ||
    (duty_cache.hasOwnProperty(`${year}-${month}-1`) &&
      duty_cache[`${year}-${month}-1`]["created_at"] < Date.now())
  ) {
    //处理thismonthduty和not_use的电话号码
    let t_this_holiday_not_use = chuli_phone(this_holiday_not_use);
    let t_this_normal_not_use = chuli_phone(this_normal_not_use);
    let t_thismonthduty = chuli_phone(thismonthduty);

    duty_cache[`${year}-${month}-1`] = {
      created_at: Date.now(),
      all_duty_list: all_duty_list,
      leaderdutyers: leaderdutyers,
      next_holiday_full_pointer: holiday_full_pointer,
      holiday_not_use: t_this_holiday_not_use,
      next_normal_full_pointer: normal_full_pointer,
      normal_not_use: t_this_normal_not_use,
      leader_normal_pointer: leader_normal_pointer,
      leader_holiday_pointer: leader_holiday_pointer,
      thismonthduty: t_thismonthduty,
      thismonthduty_leader: thismonthduty_leader,
    };
  }
};

// 次数累加工具函数
export const dutycntadd = (ish, isd, arr, idx) => {
  arr[idx]["total_duty_count"] += 1;
  if (ish) {
    arr[idx]["holiday_duty_count"] += 1;
  } else {
    arr[idx]["normal_duty_count"] += 1;
  }
  if (isd === "LEADER") {
    return;
  }
  if (isd) {
    arr[idx]["day_shift_count"] += 1;
  } else {
    arr[idx]["night_shift_count"] += 1;
  }
};

// export const makeleaderduty = (leader_name, leader_tel) => {
//   leader_name.innerHTML = "领导";
//   leader_tel.innerHTML = "0123456";
// };

export const cache_value_leader = (
  p,
  thisdutycache_leader,
  leader_name,
  leader_tel
) => {
  if (p >= thisdutycache_leader.length) {
    return;
  }
  leader_name.innerHTML = thisdutycache_leader[p]["name"];
  leader_tel.innerHTML = thisdutycache_leader[p]["phone"];
  return p + 1;
};

//缓存里面赋值操作
export const cache_value = (
  p_cache,
  arr,
  d_p_1_name,
  d_p_1_tel,
  d_p_2_name,
  d_p_2_tel,
  e_p_1_name,
  e_p_1_tel,
  e_p_2_name,
  e_p_2_tel
) => {
  if (p_cache <= arr.length - 4) {
    d_p_1_name.innerHTML = arr[p_cache]["name"];
    d_p_1_tel.innerHTML = arr[p_cache]["phone"];

    d_p_2_name.innerHTML = arr[p_cache + 1]["name"];
    d_p_2_tel.innerHTML = arr[p_cache + 1]["phone"];

    e_p_1_name.innerHTML = arr[p_cache + 2]["name"];
    e_p_1_tel.innerHTML = arr[p_cache + 2]["phone"];

    e_p_2_name.innerHTML = arr[p_cache + 3]["name"];
    e_p_2_tel.innerHTML = arr[p_cache + 3]["phone"];
    return p_cache + 4; //每天是四个人
  } else {
    return;
  }
};

// 排领导班
export const leader_duty = (
  leaderdutyers,
  leader_all_len,
  _pointer,
  thismonthduty_leader,
  leader_name,
  leader_tel,
  ish
) => {
  leader_name.innerHTML = leaderdutyers[_pointer]["name"];
  leader_tel.innerHTML = leaderdutyers[_pointer]["phone"];
  thismonthduty_leader.push(leaderdutyers[_pointer]);
  dutycntadd(ish, "LEADER", leaderdutyers, _pointer); // 加次数
  _pointer = (_pointer + 1) % leader_all_len;
  return _pointer;
};

//第一个人的班
export const duty_first = (
  all_duty_list,
  arr_not_use,
  _duty_type,
  duty_all_len,
  _full_pointer,
  all_duty_set,
  thismonthduty,
  _p_1_name,
  _p_1_tel,
  ish,
  isd
) => {
  let i = 0;
  const arr_not_use_length = arr_not_use.length; //记录初始长度
  let p1_gender;
  //加个条件，万一之前有个人存没排到，存到待选，但是这个月又不值班了
  let flag = false; //标记是否在arr_not_use中找到
  if (arr_not_use_length > 0) {
    while (
      i < arr_not_use.length &&
      !(
        (arr_not_use[i]["duty_type"] === _duty_type ||
          arr_not_use[i]["duty_type"] === "A") &&
        all_duty_set.has(arr_not_use[i]["id"])
      )
    ) {
      //如果是待选不值，需要删除待选
      if (!all_duty_set.has(arr_not_use[i]["id"])) {
        arr_not_use.splice(i, 1); //已取消值班，删除此人，指针前移了，i不用再向前移动
      } else {
        i++;
      }
    } //while

    if (i < arr_not_use.length) {
      flag = true; //找到了
      p1_gender = arr_not_use[i]["gender"]; //记录第一个性别
      _p_1_name.innerHTML = arr_not_use[i]["name"];
      let phone_number = arr_not_use[i]["phone"];
      _p_1_tel.innerHTML =
        phone_number.slice(0, 3) + "****" + phone_number.slice(7); //因为arrnotuse是直接关联的原生人员，这里还要再改一下电话号码中间*号

      dutycntadd(ish, isd, arr_not_use, i);

      thismonthduty.push(arr_not_use[i]); //这里放入当前月的
      arr_not_use.splice(i, 1); //已使用，删除此人
    }
  }

  //arr not use == 0
  if (arr_not_use_length === 0 || !flag) {
    //没有存的，找到第一个能值白天的
    let cnt = 0; //记录找的次数，最多找一遍，一般都找得到吧
    //在没使用过的里面找

    while (
      cnt < duty_all_len &&
      !(
        all_duty_list[_full_pointer]["duty_type"] === "A" ||
        all_duty_list[_full_pointer]["duty_type"] === _duty_type
      )
    ) {
      //新的规则 只值单班的人员，遇type不匹配，直接跳过，不加入待选
      // arr_not_use.push(all_duty_list[_full_pointer]); //指针跑过去了，加入待选
      _full_pointer = (_full_pointer + 1) % duty_all_len;
      cnt++;
    }
    //没找到
    if (cnt === duty_all_len) {
      console.log("error", "没找到能值白班1的");
      alert("出现错误，没找到能值白班1的，呼叫隔壁老王");
      return;
    }
    //找到了
    if (
      all_duty_list[_full_pointer]["duty_type"] === "A" ||
      all_duty_list[_full_pointer]["duty_type"] === _duty_type
    ) {
      p1_gender = all_duty_list[_full_pointer]["gender"]; //记录第一个性别
      _p_1_name.innerHTML = all_duty_list[_full_pointer]["name"];
      _p_1_tel.innerHTML = all_duty_list[_full_pointer]["phone"];

      dutycntadd(ish, isd, all_duty_list, _full_pointer);

      thismonthduty.push(all_duty_list[_full_pointer]); //这里放入当前月的
      _full_pointer = (_full_pointer + 1) % duty_all_len;
    }
  }

  return [_full_pointer, p1_gender]; //其他参数都是数组，传址的
};

// 第二个人的
export const duty_second = (
  all_duty_list,
  arr_not_use,
  _duty_type,
  duty_all_len,
  _full_pointer,
  all_duty_set,
  thismonthduty,
  _p_2_name,
  _p_2_tel,
  pre_gender,
  ish,
  isd
) => {
  let j = 0;
  const arr_not_use_length = arr_not_use.length;
  let flag = false; //标记是否在arr_not_use中找到
  if (arr_not_use_length > 0) {
    while (
      j < arr_not_use.length &&
      !(
        (arr_not_use[j]["duty_type"] === _duty_type ||
          arr_not_use[j]["duty_type"] === "A") &&
        arr_not_use[j]["gender"] === pre_gender &&
        all_duty_set.has(arr_not_use[j]["id"])
      )
    ) {
      //如果是待选不值，需要删除待选
      if (!all_duty_set.has(arr_not_use[j]["id"])) {
        arr_not_use.splice(j, 1); //已取消值班，删除此人，指针前移了，i不用再向前移动
      } else {
        j++;
      }
    } //while

    if (j < arr_not_use.length) {
      flag = true;
      _p_2_name.innerHTML = arr_not_use[j]["name"];
      let phone_number = arr_not_use[j]["phone"];
      _p_2_tel.innerHTML =
        phone_number.slice(0, 3) + "****" + phone_number.slice(7); //因为arrnotuse是直接关联的原生人员，这里还要再改一下电话号码中间*号
      dutycntadd(ish, isd, arr_not_use, j);
      thismonthduty.push(arr_not_use[j]); //这里放入当前月的
      arr_not_use.splice(j, 1); //已使用，删除此人
    }
  } //if arr_not_use_length >0

  if (arr_not_use_length === 0 || !flag) {
    //没找到存货
    //没有存的，找到第二个能值白天的
    let cnt = 0; //记录找的次数，最多找一遍，一般都找得到吧
    //在没使用过的里面找
    while (
      cnt < duty_all_len &&
      !(
        (all_duty_list[_full_pointer]["duty_type"] === "A" ||
          all_duty_list[_full_pointer]["duty_type"] === _duty_type) &&
        all_duty_list[_full_pointer]["gender"] === pre_gender
      )
    ) {
      //新的规则 只值单班的人员，遇type不匹配，直接跳过，不加入待选，第二个人只考虑性别条件即可
      if (all_duty_list[_full_pointer]["gender"] !== pre_gender) {
        arr_not_use.push(all_duty_list[_full_pointer]); //指针跑过去了，加入待选
      }

      _full_pointer = (_full_pointer + 1) % duty_all_len;

      cnt++;
    }
    //没找到
    if (cnt === duty_all_len) {
      console.log("error", "没找到能值白班2的");
      alert("出现错误，没找到能值白班2的，呼叫隔壁老王");
      return;
    }
    //找到了
    if (
      all_duty_list[_full_pointer]["duty_type"] === "A" ||
      all_duty_list[_full_pointer]["duty_type"] === _duty_type
    ) {
      _p_2_name.innerHTML = all_duty_list[_full_pointer]["name"];
      _p_2_tel.innerHTML = all_duty_list[_full_pointer]["phone"];

      dutycntadd(ish, isd, all_duty_list, _full_pointer);

      thismonthduty.push(all_duty_list[_full_pointer]); //这里放入当前月的

      _full_pointer = (_full_pointer + 1) % duty_all_len;
    }
  }
  return _full_pointer;
};

// 排班核心函数
export const makeDuty = async (list) => {
  displayloading(); //加载
  let if_nodevalue = list[6].attributes["date"].nodeValue; //第6个是第一排最后一个，肯定有数据
  const curmonthdata = if_nodevalue.split("-"); //拿到当前月年份和月份
  const year = parseInt(curmonthdata[0]);
  const month = parseInt(curmonthdata[1]);

  //优先级是先查缓存，然后数据库(数据库只存当月的)，最后现排
  let havethiscache = duty_cache.hasOwnProperty(`${year}-${month}-1`); //标记缓存是否有月数据
  if (havethiscache) {
    let thisdutycache =
      duty_cache[`${year}-${month}-1`]["thismonthduty"].slice(); // 做个深拷贝，不然会变的

    let thisdutycache_leader =
      duty_cache[`${year}-${month}-1`]["thismonthduty_leader"].slice(); // 做个深拷贝，不然会变的

    let p_cache = 0;
    let p_cache_leader = 0;
    list.forEach((item) => {
      let {
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
      } = getdom(item);

      let else_nodevalue = dayjs(item.attributes["date"].nodeValue);
      if (
        else_nodevalue.isAfter(dayjs(config.startTime)) &&
        else_nodevalue.isBefore(dayjs(config.endTime))
      ) {
        if (!item.classList.contains("notthisMonth")) {
          p_cache_leader = cache_value_leader(
            p_cache_leader,
            thisdutycache_leader,
            leader_name,
            leader_tel
          );

          p_cache = cache_value(
            p_cache,
            thisdutycache,
            d_p_1_name,
            d_p_1_tel,
            d_p_2_name,
            d_p_2_tel,
            e_p_1_name,
            e_p_1_tel,
            e_p_2_name,
            e_p_2_tel
          );
        } //thismonth
        else {
          initdomdata(
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
          );
        } //notthismonth
      } //if (else_nodevalue.isAfter(dayjs(config.startTime)) && else_nodevalue.isBefore(dayjs(config.endTime)
      else {
        //非排班日期的全部清空
        initdomdata(
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
        );
      }
    });
  } else if (!havethiscache) {
    //如果没有缓存，先从数据库找。
    const curmonthdutyinfo = await requestthismonthduty(`${year}-${month}-1`);

    let curmonthduty = [];
    let curmonthduty_leader = [];
    if (
      curmonthdutyinfo.length > 0
      // &&curmonthdutyinfo[0]["thismonthduty_db"].length > 0
    ) {
      curmonthduty = JSON.parse(curmonthdutyinfo[0]["thismonthduty_db"]);
      curmonthduty_leader = JSON.parse(
        curmonthdutyinfo[0]["thismonthduty_db_leader"]
      );
    }

    //如果数据库有数据，就用数据库的数据（这里其实有问题，万一一个有一个没有呢？）
    if (curmonthduty.length > 0 && curmonthduty_leader.length > 0) {
      //先把当月的缓存一波

      let [all_duty_list, leaderdutyers] = await everymonthdutyerqueue(
        `${year}-${month}-1`
      ); // 请求一下当月的数据库数据，应该有吧

      make_cache(
        year,
        month,
        all_duty_list.slice(),
        leaderdutyers.slice(),
        curmonthdutyinfo[0]["holiday_full_pointer"],
        curmonthdutyinfo[0]["last_holiday_not_use"],
        curmonthdutyinfo[0]["normal_full_pointer"],
        curmonthdutyinfo[0]["last_normal_not_use"],
        curmonthdutyinfo[0]["leader_normal_pointer"],
        curmonthdutyinfo[0]["leader_holiday_pointer"],
        curmonthduty,
        curmonthduty_leader
      );

      let p_cache = 0; // 在缓存值班数组里的指针
      let p_cache_leader = 0;
      list.forEach((item) => {
        let {
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
        } = getdom(item);

        let else_nodevalue = dayjs(item.attributes["date"].nodeValue);
        if (
          else_nodevalue.isAfter(dayjs(config.startTime)) &&
          else_nodevalue.isBefore(dayjs(config.endTime))
        ) {
          if (!item.classList.contains("notthisMonth")) {
            p_cache_leader = cache_value_leader(
              p_cache_leader,
              curmonthduty_leader,
              leader_name,
              leader_tel
            );

            p_cache = cache_value(
              p_cache,
              curmonthduty,
              d_p_1_name,
              d_p_1_tel,
              d_p_2_name,
              d_p_2_tel,
              e_p_1_name,
              e_p_1_tel,
              e_p_2_name,
              e_p_2_tel
            );
          } //thismonth
          else {
            initdomdata(
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
            );
          } //notthismonth
        } //if (else_nodevalue.isAfter(dayjs(config.startTime)) && else_nodevalue.isBefore(dayjs(config.endTime)
        else {
          //非排班日期的全部清空
          initdomdata(
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
          );
        }
      });
      havethisdb = true; //已采用数据库数据
    } else {
      havethisdb = false;
    }
  }

  //没有缓存数据库又没有数据，现场排
  if (!havethiscache && !havethisdb) {
    let all_duty_list = [],
      duty_all_len = 0,
      leaderdutyers = [],
      leader_all_len = 0,
      leaderdutyers_normal = [],
      leader_all_len_normal = 0,
      leader_normal_pointer = 0,
      leader_holiday_pointer = 0,
      holiday_full_pointer = 0,
      last_holiday_not_use = 0,
      normal_full_pointer = 0,
      last_normal_not_use = [],
      p1_gender,
      p3_gender,
      have_this_month_duty = false, //标记本月值班表是否出了
      have_this_month_leader_duty = false; //标记本月值班表是否出了

    const [l_year, last_month] = get_lastMonth_name(year, month); //上月名称

    //请求值班队列
    //1.如果是23年5月开始的，就直接找原生dutypersons
    // if (year === parseInt(config.startTime.split('-')[0]) && month === parseInt(config.startTime.split('-')[1])) {
    //   all_duty_list = await requestoriginpersons();
    //   //post一个数据,判断是否已post一份去数据库值班队列，这里不用担心刷新后有重复提交的问题，
    //   //既然上面缓存和数据库都没查到，正常情况就是没提交的，这里后面排班提交成功后，后面访问直接从上面进了
    //   await postdutyerqueuetodb(year, month, all_duty_list);
    //   have_this_month_duty = true; //五月也给一个post才对
    // }
    // else {
    [all_duty_list, leaderdutyers] = await everymonthdutyerqueue(
      `${year}-${month}-1`
    );

    // console.log('all_duty_list', all_duty_list);

    if (all_duty_list.length > 0 && leaderdutyers.length > 0) {
      //请求到了月安排表，说明排班安排已经定了，排出的值班表可以存数据库
      have_this_month_duty = true; //这里主要给存数据库用
      have_this_month_leader_duty = true;
    } else {
      // 没的话就找一次上一月的，再没有就找原始的
      [all_duty_list, leaderdutyers] = await everymonthdutyerqueue(
        `${l_year}-${last_month}-1`
      );
      if (all_duty_list.length === 0) {
        //alert(`${year}年${month}月排班未出，采用目前人员预排，后续会有变动。`);
        all_duty_list = await requestoriginpersons();
        leaderdutyers = await requestleaderdutyers();
      }
    }

    duty_all_len = all_duty_list.length;
    leader_all_len = leaderdutyers.length;

    leaderdutyers_normal = leaderdutyers.filter(
      (item) => item["normal_number"] > 0
    ); // 普通領導

    leader_all_len_normal = leaderdutyers_normal.length;

    //排这个月的班，需要上个月的一些指针和人员数据，还是先从缓存找
    if (duty_cache.hasOwnProperty(`${l_year}-${last_month}-1`)) {
      // console.log(duty_cache[`${l_year}-${last_month}-1`]);

      holiday_full_pointer =
        duty_cache[`${l_year}-${last_month}-1`]["next_holiday_full_pointer"];

      holiday_full_pointer = correct_full_pointer(
        duty_cache[`${l_year}-${last_month}-1`]["all_duty_list"],
        all_duty_list,
        holiday_full_pointer
      );

      last_holiday_not_use =
        duty_cache[`${l_year}-${last_month}-1`]["holiday_not_use"];

      normal_full_pointer =
        duty_cache[`${l_year}-${last_month}-1`]["next_normal_full_pointer"];

      normal_full_pointer = correct_full_pointer(
        duty_cache[`${l_year}-${last_month}-1`]["all_duty_list"],
        all_duty_list,
        normal_full_pointer
      );

      last_normal_not_use =
        duty_cache[`${l_year}-${last_month}-1`]["normal_not_use"];

      leader_normal_pointer =
        duty_cache[`${l_year}-${last_month}-1`]["leader_normal_pointer"];

      leader_normal_pointer = correct_full_pointer(
        duty_cache[`${l_year}-${last_month}-1`]["leaderdutyers"],
        leaderdutyers,
        leader_normal_pointer
      );

      leader_holiday_pointer =
        duty_cache[`${l_year}-${last_month}-1`]["leader_holiday_pointer"];

      leader_holiday_pointer = correct_full_pointer(
        duty_cache[`${l_year}-${last_month}-1`]["leaderdutyers"],
        leaderdutyers,
        leader_holiday_pointer
      );
    }
    //缓存没有，就请求数据库
    else {
      // console.log("没有缓存", year, month);

      [
        holiday_full_pointer,
        last_holiday_not_use,
        normal_full_pointer,
        last_normal_not_use,
        leader_holiday_pointer,
        leader_normal_pointer,
        thismonthduty_db,
        thismonthduty_db_leader,
      ] = await requestDataFunc(l_year, last_month);

      let [last_duty_list, last_leaderdutyers] = await everymonthdutyerqueue(
        `${l_year}-${last_month}-1`
      ); // 请求上月的值班人员，校正指针用

      if (last_duty_list.length > 0) {
        holiday_full_pointer = correct_full_pointer(
          last_duty_list,
          all_duty_list,
          holiday_full_pointer
        );

        normal_full_pointer = correct_full_pointer(
          last_duty_list,
          all_duty_list,
          normal_full_pointer
        );
      }
      if (last_leaderdutyers.length > 0) {
        //這裡處理一下領導的序列
        let last_leaderdutyers_normal = last_leaderdutyers.filter(
          (item) => item["normal_number"] > 0
        ); // 普通領導
        leader_holiday_pointer = correct_full_pointer(
          last_leaderdutyers,
          leaderdutyers,
          leader_holiday_pointer
        );

        leader_normal_pointer = correct_full_pointer(
          last_leaderdutyers_normal,
          leaderdutyers_normal,
          leader_normal_pointer
        );
      }
    }

    let thismonthduty = []; //记录切换到的月份值班信息，之后加入到CalendarDisplay.duty_cache里作为缓存
    let thismonthduty_leader = [];
    let this_holiday_not_use =
      last_holiday_not_use.length > 0 ? last_holiday_not_use.slice() : []; //直接做一个深拷贝在上个月后面push这个月没用的;
    let this_normal_not_use =
      last_normal_not_use.length > 0 ? last_normal_not_use.slice() : [];

    let all_duty_set = new Set(
      all_duty_list
        .filter((item) => item["duty_type"] !== "N")
        .map((item) => item["id"])
    ); // 存放当月真正要值班的人的id的hash表，用来排除not_use但是下月又不值班的人

    list.forEach((item) => {
      let {
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
      } = getdom(item);

      //这里排班
      //前提 1.starttime 2.!notthisMonth
      //优先级  白天 1.isHolidays  |  1.makeUpday  2.weekend && !makeUpday
      //        晚上 1.isHolidays |  1.makeUpday  2.weekend && !makeUpday 3.其他
      let else_nodevalue = dayjs(item.attributes["date"].nodeValue);
      if (
        else_nodevalue.isAfter(dayjs(config.startTime)) &&
        else_nodevalue.isBefore(dayjs(config.endTime))
      ) {
        if (!item.classList.contains("notthisMonth")) {
          if (
            item.classList.contains("isHolidays") &&
            !item.classList.contains("isyuandan")
          ) {
            leader_holiday_pointer = leader_duty(
              leaderdutyers,
              leader_all_len,
              leader_holiday_pointer,
              thismonthduty_leader,
              leader_name,
              leader_tel,
              true
            );

            [holiday_full_pointer, p1_gender] = duty_first(
              all_duty_list,
              this_holiday_not_use,
              "D",
              duty_all_len,
              holiday_full_pointer,
              all_duty_set,
              thismonthduty,
              d_p_1_name,
              d_p_1_tel,
              true,
              true
            );

            ////////////////////////////第二个白天//////////////////////////////////////////
            holiday_full_pointer = duty_second(
              all_duty_list,
              this_holiday_not_use,
              "D",
              duty_all_len,
              holiday_full_pointer,
              all_duty_set,
              thismonthduty,
              d_p_2_name,
              d_p_2_tel,
              p1_gender,
              true,
              true
            );

            //////////////////////////////晚班第一个//////////////////////////////

            [holiday_full_pointer, p3_gender] = duty_first(
              all_duty_list,
              this_holiday_not_use,
              "E",
              duty_all_len,
              holiday_full_pointer,
              all_duty_set,
              thismonthduty,
              e_p_1_name,
              e_p_1_tel,
              true,
              false
            );

            //////////////////////////////晚班第2个//////////////////////////////////////
            holiday_full_pointer = duty_second(
              all_duty_list,
              this_holiday_not_use,
              "E",
              duty_all_len,
              holiday_full_pointer,
              all_duty_set,
              thismonthduty,
              e_p_2_name,
              e_p_2_tel,
              p3_gender,
              true,
              false
            );
          } //item.classList.contains('isHolidays')
          else if (
            item.classList.contains("isHolidays") &&
            item.classList.contains("isyuandan")
          ) {
            leader_normal_pointer = leader_duty(
              leaderdutyers_normal,
              leader_all_len_normal,
              leader_normal_pointer,
              thismonthduty_leader,
              leader_name,
              leader_tel,
              true
            );
            ////////////////////////////第一个白天////////////////////////////
            [normal_full_pointer, p1_gender] = duty_first(
              all_duty_list,
              this_normal_not_use,
              "D",
              duty_all_len,
              normal_full_pointer,
              all_duty_set,
              thismonthduty,
              d_p_1_name,
              d_p_1_tel,
              true,
              true
            );

            ////////////////////////////第二个白天//////////////////////////////////////////
            normal_full_pointer = duty_second(
              all_duty_list,
              this_normal_not_use,
              "D",
              duty_all_len,
              normal_full_pointer,
              all_duty_set,
              thismonthduty,
              d_p_2_name,
              d_p_2_tel,
              p1_gender,
              true,
              true
            );

            //////////////////////////////晚班第一个//////////////////////////////

            [normal_full_pointer, p3_gender] = duty_first(
              all_duty_list,
              this_normal_not_use,
              "E",
              duty_all_len,
              normal_full_pointer,
              all_duty_set,
              thismonthduty,
              e_p_1_name,
              e_p_1_tel,
              true,
              false
            );

            //////////////////////////////晚班第2个//////////////////////////////////////
            normal_full_pointer = duty_second(
              all_duty_list,
              this_normal_not_use,
              "E",
              duty_all_len,
              normal_full_pointer,
              all_duty_set,
              thismonthduty,
              e_p_2_name,
              e_p_2_tel,
              p3_gender,
              true,
              false
            );
          } else {
            //普通班，一条线拉通
            //非节假日直接白天、晚上1条线

            leader_normal_pointer = leader_duty(
              leaderdutyers_normal,
              leader_all_len_normal,
              leader_normal_pointer,
              thismonthduty_leader,
              leader_name,
              leader_tel,
              false
            );

            if (
              item.classList.contains("weekend") &&
              !item.classList.contains("makeUpday")
            ) {
              //非补班的周末，白天、晚上都要//优先在上个月没用的中找

              ////////////////////////////第一个白天////////////////////////////
              [normal_full_pointer, p1_gender] = duty_first(
                all_duty_list,
                this_normal_not_use,
                "D",
                duty_all_len,
                normal_full_pointer,
                all_duty_set,
                thismonthduty,
                d_p_1_name,
                d_p_1_tel,
                false,
                true
              );

              ////////////////////////////第二个白天//////////////////////////////////////////
              normal_full_pointer = duty_second(
                all_duty_list,
                this_normal_not_use,
                "D",
                duty_all_len,
                normal_full_pointer,
                all_duty_set,
                thismonthduty,
                d_p_2_name,
                d_p_2_tel,
                p1_gender,
                false,
                true
              );

              //////////////////////////////晚班第一个//////////////////////////////

              [normal_full_pointer, p3_gender] = duty_first(
                all_duty_list,
                this_normal_not_use,
                "E",
                duty_all_len,
                normal_full_pointer,
                all_duty_set,
                thismonthduty,
                e_p_1_name,
                e_p_1_tel,
                false,
                false
              );

              //////////////////////////////晚班第2个//////////////////////////////////////
              normal_full_pointer = duty_second(
                all_duty_list,
                this_normal_not_use,
                "E",
                duty_all_len,
                normal_full_pointer,
                all_duty_set,
                thismonthduty,
                e_p_2_name,
                e_p_2_tel,
                p3_gender,
                false,
                false
              );
            } //if (item.classList.contains('weekend') && (!item.classList.contains('makeUpday')))
            else {
              //其他白天都是办公室，晚上继续
              d_p_1_name.innerHTML = "办公室";
              d_p_1_tel.innerHTML = "4xxxxxx6";

              thismonthduty.push(constant.bangongshi); //这里放入办公室

              d_p_2_name.innerHTML = "";
              d_p_2_tel.innerHTML = "";

              thismonthduty.push(constant.bangongshi); //这里放入办公室

              //////////////////////////////晚班第一个//////////////////////////////

              [normal_full_pointer, p3_gender] = duty_first(
                all_duty_list,
                this_normal_not_use,
                "E",
                duty_all_len,
                normal_full_pointer,
                all_duty_set,
                thismonthduty,
                e_p_1_name,
                e_p_1_tel,
                false,
                false
              );

              //////////////////////////////晚班第2个//////////////////////////////////////
              normal_full_pointer = duty_second(
                all_duty_list,
                this_normal_not_use,
                "E",
                duty_all_len,
                normal_full_pointer,
                all_duty_set,
                thismonthduty,
                e_p_2_name,
                e_p_2_tel,
                p3_gender,
                false,
                false
              );
            } //else (item.classList.contains('weekend') && (!item.classList.contains('makeUpday')))
          } //not holiday
        } //month
        else {
          initdomdata(
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
          );
        } //notthismonth
      } //if dayjs
      else {
        //非排班日期的全部清空
        initdomdata(
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
        );
      }
    }); //foreach

    //////////排完之后，把数据post进数据库,这里应该是排班顺序定了就该post////////
    if (have_this_month_duty) {
      await postdatatodb(
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
      );

      //其实上面post已经需要权限了,没权限也到不到这里来
      const token = localStorage.getItem("token");
      if (token) {
        const authorizationheaders = { Authorization: `Bearer ${token}` };
        const batchSize = 50; // sqlite3多了不行要分批，每个批次的大小
        const batches = [];
        for (let i = 0; i < thismonthduty.length; i += batchSize) {
          batches.push(thismonthduty.slice(i, i + batchSize));
        }
        //然后再修改dutyer的值班次数
        try {
          const promises = batches.map((batch) => {
            return urlrequest.put(
              `${config.requesturl}/api/dutycalendar/dutypersons`,
              {
                data: batch,
              },
              authorizationheaders
            );
          });
          await Promise.all(promises); //使用 Promise.all() 方法来等待所有的请求都完成后再继续执行
        } catch (error) {
          console.log("error:", error);
          throw error;
        }

        // 修改领导值班次数
        try {
          urlrequest.put(
            `${config.requesturl}/api/dutycalendar/leaderdutyers`,
            {
              data: thismonthduty_leader,
            },
            authorizationheaders
          );
        } catch (error) {
          console.log("error:", error);
          throw error;
        }
      } else {
        alert("没有管理员权限，排班次数提交数据库失败！");
        endloading(); //这里结束一下加载中模态框，不然无法登录
      }
    }

    //排完班后进行缓存,not_use数组存的是原生数据，缓存的时候要处理电话

    make_cache(
      year,
      month,
      all_duty_list.slice(),
      leaderdutyers.slice(),
      holiday_full_pointer,
      this_holiday_not_use,
      normal_full_pointer,
      this_normal_not_use,
      leader_normal_pointer,
      leader_holiday_pointer,
      thismonthduty,
      thismonthduty_leader
    );
  } //排班
  endloading(); //在post和缓存后终止动画
}; //make duty
