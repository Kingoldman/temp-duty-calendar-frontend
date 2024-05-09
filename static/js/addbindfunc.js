// 日历基础功能之外的功能，比如统计、登录、导出
import { urlrequest } from "./UrlRequest.js";
import { config } from "./config.js";

import {
  dutyerlist_func,
  analysis_func,
  logout_func,
  login_func,
  export_func,
  anpaizhiban,
} from "./addbtnevent.js";

// 渲染主面之后，再绑定一些事件
export const add_bind_func = async () => {
  await dutyerlist_func(); // 值班人员列表
  await analysis_func(); // 值班统计
  await logout_func(); //登录退出
  await login_func();
  await export_func(); // 导出表格
  await anpaizhiban(); // 排班
};

// 加入进入限制
export const into_func = async () => {
  //字符串类型的密钥转换为 WordArray 类型；密钥长度需要符合 AES 加密算法的要求，可以是 128、192 或 256 位，如果不足需要进行填充；
  const key = CryptoJS.enc.Utf8.parse("012345678123456789101213"); // 呵呵
  const intoform = document.getElementById("into-form");
  if (intoform) {
    intoform.addEventListener("submit", async (event) => {
      event.preventDefault();
      const intostr = document.getElementById("into").value;
      //检查表单是否填写完整
      if (intostr.trim() === "") {
        alert("请填写访问密码！");
        return;
      }

      const encryptedintostr = CryptoJS.AES.encrypt(intostr, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      }).toString();

      let response = "";
      try {
        response = await urlrequest.post(
          `${config.requesturl}/api/dutycalendar/into`,
          {
            data: { intostr: encryptedintostr },
          }
        );

        if (response.code === 200) {
          await add_bind_func();

          document.getElementById("main-content").style.display = "block";
          document.getElementById("login-form").style.display = "none";
        } else {
          alert("密码错误，请重新输入！");
          return;
        }
      } catch (error) {
        console.error("请求失败：", error);
        throw error;
      }
    });
  }
};
