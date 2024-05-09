// dom代码片段
import { config } from "./config.js";


// 每行
export let cell_row_start = `
<div class="calendar-main-row d-flex">
`;
export let cell_row_end = `</div>`;

// 周一至周五每个cell
export let cell_1_5 = `<div class="calendar-main-col hover-bg">
<div class="calendar-col-day-info">
  <div class ="yl badge bg-primary">
  </div>
  <div class ="other-info badge">
  </div>
</div>
<div class="duty">
  
  <div class ="leader">
      <div class ="leader-tag">
        领导
      </div>
      <div class ="leader-info">
        <div class ="leader-name">
         领导
        </div>
        <div class ="leader-tel">
        0123456
        </div>
      </div>
      <!--这里用一个透明div占位置-->
      <div class ="leader-info"  style="opacity: 0;">
        <div>
          占位符
        </div>
        <div>
        0123456
        </div>
      </div>

  </div>

  <div class ="daytime">
    <div class ="daytime-tag">
      白班
    </div>
    <div class = "d-person-one">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
    <div class = "d-person-two">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
  </div>

  <div class ="evening">
    <div class ="evening-tag">
      晚班
    </div>
    <div class = "e-person-one">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
    <div class = "e-person-two">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
  </div>
  
</div>
</div>`;
// 周末每个cell
export let cell_6_7 = `<div class="calendar-main-col hover-bg weekend">
<div class="calendar-col-day-info">
  <div class ="yl badge bg-warning">
  </div>
  <div class ="other-info badge">
  </div>
</div>
<div class="duty">
  
  <div class ="leader">
      <div class ="leader-tag">
        领导
      </div>
      <div class ="leader-info">
        <div class ="leader-name">
        领导
        </div>
        <div class ="leader-tel">
        0123456
        </div>
      </div>
      
      <div class ="leader-info" style="opacity: 0;">
        <div>
          占位符
        </div>
        <div>
        0123456
        </div>
      </div>

  </div>

  <div class ="daytime">
    <div class ="daytime-tag">
      白班
    </div>
    <div class = "d-person-one">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
    <div class = "d-person-two">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
  </div>

  <div class ="evening">
    <div class ="evening-tag">
      晚班
    </div>
    <div class = "e-person-one">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
    <div class = "e-person-two">
      <div class = "name">某某某</div>
      <div class = "tel">0123456</div>
    </div>
  </div>
  
</div>
</div>`;

export const year_select_start = `<div class = "select-year">
<select class="form-select form-select-secondary calendar-toolbar-item select-year" aria-label="select-year" disabled>`;

export const year_select_end = `</select>
</div>`;
export const month_select_start = `<div class = "select-month">
<select class="form-select form-select-secondary calendar-toolbar-item select-month" aria-label="select-month" disabled>`;
export const month_select_end = `</select>
</div>`;

export const year_month_select_start = `<div class="d-flex p-2">`;
export const year_month_select_end = `</div>`;

export const time_switch = `<div class="d-flex justify-content-between">
<button type="button" class="btn btn-outline-primary last-month">上一月</button>
<button type="button" class="calendar-toolbar-item btn btn-outline-primary next-month">下一月</button>
<button type="button" class="calendar-toolbar-item btn btn-outline-primary back-today">返回今天</button>
</div>`;

export const manage_zhiban = `<div class="d-flex">
<button type="button" class="calendar-toolbar-item btn btn-outline-warning data-bs-toggle="modal" data-bs-target="#dutyerlistModal" id = "dutyerlist">值班人员</button>

<button type="button" class="calendar-toolbar-item btn btn-outline-warning" id = "analysis">值班统计</button>

<button type="button" class="calendar-toolbar-item btn btn-outline-dark" id = "export-btn">导出值班表</button>
</div>`;


export const other_dom = `<div class="d-flex"><button type="button" class="btn btn-outline-success" id = "loginBtn">登录</button></div>

<div class="d-flex"><button type="button" class="btn btn-outline-danger" id = "anpaiBtn">排班</button></div>`;
