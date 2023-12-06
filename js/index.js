// Yimin師：不建議使用alert，因為會中斷使用者體驗，較建議用sweet alert
function init() {
  getProductList();
  getCartList();
}
// 師：監聽要綁在外層ul，而不是內層的li的原因，在於用inner.HTML替換掉的新li就是新的DOM元素了，之前綁的都會被覆蓋，為了不要一直重綁很麻煩，因此要綁在外層比較好
const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect"); //select
const cartList = document.querySelector(".shoppingCart-tableList");
let productData = [];
let cartData = [];
function getProductList() {
  axios
    .get(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products
  `
    )
    .then(function (response) {
      productData = response.data.products;
      renderProductList();
    });
}
// 傳來這裡的參數item是data中的物件
// 要在購物車的字串抓到id的值，所以要埋id
function combineProductHTMLItem(item) {
  return `<li class="productCard">
  <h4 class="productType">新品</h4>
  <img src="${item.images}" alt="">
  <a href="#" class="addCardBtn js-addCart" data-id="${item.id}">加入購物車</a>
  <h3>${item.title}</h3>
  <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
  <p class="nowPrice">NT$${toThousands(item.price)}</p>
  </li>`;
}
function renderProductList() {
  let str = "";
  productData.forEach(function (item) {
    str += combineProductHTMLItem(item);
  });
  productList.innerHTML = str;
}
// 類別有對應product category才顯示
productSelect.addEventListener("change", function (e) {
  const category = e.target.value;
  if (category == "全部") {
    renderProductList();
    return;
  }
  let str = "";
  productData.forEach(function (item) {
    if (item.category == category) {
      str += combineProductHTMLItem(item);
    }
  });
  productList.innerHTML = str;
});

productList.addEventListener("click", function (e) {
  e.preventDefault();
  // 取出"data-id"這個屬性的值
  // console.log(e.target.getAttribute("data-id"));
  let addCartClass = e.target.getAttribute("class");
  // (my理解)如果是用==js-addCart可以繼續往下跑，在true的情況下當然沒問題，但若是false還是要用return擋住，因此倒不如一開始就用!==就return的寫法，相當於設一道閘門濾掉不符合的項目，只有class="js-addCart"才能繼續跑if後面的code
  // 用class過濾出目標元素
  if (addCartClass !== "addCardBtn js-addCart") {
    return;
  }
  let productId = e.target.getAttribute("data-id");
  let numCheck = 1;

  cartData.forEach(function (item) {
    // 遍歷購物車裡商品的id是否=所點擊新增的商品的id
    if (item.product.id === productId) {
      numCheck = item.quantity += 1;
    }
  });

  axios
    .post(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`,
      {
        data: {
          productId: productId,
          quantity: numCheck,
        },
      }
    )
    .then(function (response) {
      alert("加入購物車");
      getCartList();
    });
});

// 取得購物車列表
function getCartList() {
  axios
    .get(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts
  `
    )
    .then(function (response) {
      console.log();
      document.querySelector(".js-total").textContent = toThousands(
        response.data.finalTotal
      );
      cartData = response.data.carts;
      let str = "";
      cartData.forEach(function (item) {
        str += `<tr>
      <td>
        <div class="cardItem-title">
          <img src="${item.product.images}" alt="">
          <p>${item.product.title}</p>
        </div>
      </td>
      <td>NT$${toThousands(item.product.price)}</td>
      <td>${item.quantity}</td>
      <td>NT$${toThousands(item.product.price * item.quantity)}</td>
      <td class="discardBtn">
        <a href="#" class="material-icons" data-id="${item.id}">
          clear
        </a>
      </td>
    </tr>`;
      });
      cartList.innerHTML = str;
    });
}

cartList.addEventListener("click", function (e) {
  e.preventDefault();
  const cardId = e.target.getAttribute("data-id");
  if (cardId == null) {
    alert("點到其他了");
    return;
  }
  // console.log(cardId);
  axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cardId}
  `
    )
    .then(function (response) {
      alert("刪除單筆購物車商品成功");
      getCartList();
    });
});
// 刪除全部購物車流程
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  axios
    .delete(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts
  `
    )
    .then(function (response) {
      alert("刪除全部購物車商品");
      getCartList();
    })
    .catch(function (response) {
      alert("購物車已清空，請勿重複點擊");
    });
});

// 送出訂單
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click", function (e) {
  e.preventDefault();
  if (cartData.length == 0) {
    alert("購物車是空的，請加入商品^w^");
    return;
  }
  const customerName = document.querySelector("#customerName").value;
  const customerPhone = document.querySelector("#customerPhone").value;
  const customerEmail = document.querySelector("#customerEmail").value;
  const customerAddress = document.querySelector("#customerAddress").value;
  const tradeWay = document.querySelector("#tradeWay").value;

  if (
    customerName == "" ||
    customerPhone == "" ||
    customerEmail == "" ||
    customerAddress == "" ||
    tradeWay == ""
  ) {
    alert("請輸入訂單資訊");
    return;
  }
  // 信箱驗證
  if (validateEmail(customerEmail) == false) {
    alert("請填寫正確的email格式");
    return;
  }
  // 手機驗證
  if (validatePhone(customerPhone) == false) {
    alert("請填寫正確的手機格式");
    return;
  }

  axios
    .post(
      `https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`,
      {
        data: {
          user: {
            name: customerName,
            tel: customerPhone,
            email: customerEmail,
            address: customerAddress,
            payment: tradeWay,
          },
        },
      }
    )
    .then(function (response) {
      alert("訂單建立成功");
      // 清空原本填寫的值
      document.querySelector("#customerName").value = "";
      document.querySelector("#customerPhone").value = "";
      document.querySelector("#customerEmail").value = "";
      document.querySelector("#customerAddress").value = "";
      document.querySelector("#tradeWay").value = "";
      getCartList();
    });
});
// Email
const customerEmail = document.querySelector("#customerEmail");

customerEmail.addEventListener("blur", function (e) {
  e.preventDefault();
  if (validateEmail(customerEmail.value) == false) {
    document.querySelector(`[data-message=Email]`).textContent =
      "請填寫正確的email格式";
    return;
  }
});
// Phone
const customerPhone = document.querySelector("#customerPhone");

customerPhone.addEventListener("blur", function (e) {
  e.preventDefault();
  if (validatePhone(customerPhone.value) == false) {
    document.querySelector(`[data-message=phone]`).textContent =
      "請填寫正確的手機格式";
    return;
  }
});
// 千分位設計
function toThousands(x) {
  let parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
// 驗證email
function validateEmail(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  } else {
    return false;
  }
}
// 驗證手機號碼
function validatePhone(phone) {
  if (/^09[0-9]{8}$/.test(phone)) {
    return true;
  } else {
    return false;
  }
}

init();
