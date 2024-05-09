// 一些工具类


//小于10的数字前加0
export const formatNum = (num) => {
  return num < 10 ? "0" + num : num;
};

export const chuli_phone = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    let phone_number = arr[i]["phone"];
    arr[i]["phone"] = phone_number.slice(0, 3) + "****" + phone_number.slice(7); //因为arrnotuse是直接关联的原生人员，这里还要再改一下电话号码中间*号
  }
  return arr;
};


export const displayloading = () => {
  // 显示加载中
  const modal = document.querySelector("#loadingModal");
  modal.classList.add("show");
  modal.style.display = "block";
};

export const endloading = () => {
  // 移除加载中
  const modal = document.querySelector("#loadingModal");
  modal.classList.remove("show");
  modal.style.display = "none";
};
