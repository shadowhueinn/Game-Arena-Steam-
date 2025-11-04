let itemsData = [];
let renderdflag = false;

// Fetch games from API
function fetchGames() {
  fetch('/api/games')
    .then(response => response.json())
    .then(games => {
      itemsData = games;
      renderItems();
    })
    .catch(error => {
      console.error('Error fetching games:', error);
      // Fallback to localStorage if API fails
      itemsData = JSON.parse(localStorage.getItem("itemsData")) || [];
      const defaultGames = [
        {
          id: 1,
          name: "RED DEAD II REDEMPTION",
          price: 130,
          category: "Category 1",
          image: "../images/redead.jpg",
        },
        {
          id: 2,
          name: "Galactic Invaders",
          price: 50,
          category: "Category 1",
          image: "../images/galactic.jpeg",
        },
        {
          id: 3,
          name: "Grand Theft Auto 6",
          price: 70,
          category: "Category 1",
          image: "../images/Grand-Theft-Auto-6.jpg",
        },
        {
          id: 4,
          name: "Block Buster",
          price: 40,
          category: "Category 2",
          image: "../images/block.jpeg",
        },
        {
          id: 5,
          name: "Shadow Ninja",
          price: 60,
          category: "Category 2",
          image: "../images/shadow.jpeg",
        },
        {
          id: 6,
          name: "Fifa 2023",
          price: 80,
          category: "Category 3",
          image: "../images/fifa.jpeg",
        },
      ];
      // Merge default games if not present
      defaultGames.forEach(defaultGame => {
        if (!itemsData.find(item => item.id === defaultGame.id)) {
          itemsData.push(defaultGame);
        }
      });
      localStorage.setItem("itemsData", JSON.stringify(itemsData));
      renderItems();
    });
}

// Call fetchGames on load
fetchGames();

let storedItems;
// Render items on the page
function renderItems() {
  const itemsContainer = document.getElementById("items-container");
  const categorySelect = document.getElementById("category-select");
  const sortSelect = document.getElementById("sort-select");

  // Clear existing items
  itemsContainer.innerHTML = "";

  // Get selected category and sort options
  const selectedCategory = categorySelect.value;
  const selectedSort = sortSelect.value;

  // Retrieve items from local storage or initialize an empty array
  storedItems = localStorage.getItem("itemsData");
  let itemsData;

  if (storedItems) {
    itemsData = JSON.parse(storedItems);
  } else {
    itemsData = [];
  }

  // Filter and sort items based on selected options
  let filteredItems = itemsData;

  if (selectedCategory) {
    filteredItems = filteredItems.filter(
      (item) => item.category === selectedCategory
    );
  }

  if (selectedSort === "lowToHigh") {
    filteredItems.sort((a, b) => a.price - b.price);
  } else if (selectedSort === "highToLow") {
    filteredItems.sort((a, b) => b.price - a.price);
  }

  // Render each item
  filteredItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card col-md-3";

    const img = document.createElement("img");
    img.className = "card-img-top";
    img.src = item.image;
    img.alt = item.name;

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = item.name;

    const price = document.createElement("p");
    price.className = "card-text";
    price.textContent = "₱ " + item.price;

    const playNowBtn = document.createElement("button");
    playNowBtn.className = "btn btn-success";
    playNowBtn.textContent = "Play Now";
    playNowBtn.addEventListener("click", () => {
      window.location.href = `gamePage.html?gameId=${item.id}`;
    });

    const addToCartBtn = document.createElement("button");
    addToCartBtn.className = "btn btn-primary";
    addToCartBtn.textContent = "Add to Cart";
    addToCartBtn.addEventListener("click", () => {
      // Check login status using sessionStorage
      if (sessionStorage.getItem("isLoggedIn") === "true") {
        addToCart(item);
      } else {
        alert("Please log in to add items to your cart.");
        window.location.href = "../pages/Login.html";
      }
    });

    cardBody.appendChild(title);
    cardBody.appendChild(price);
    cardBody.appendChild(playNowBtn);
    cardBody.appendChild(addToCartBtn);

    card.appendChild(img);
    card.appendChild(cardBody);

    itemsContainer.appendChild(card);
  });
}

// Add item to cart
function addToCart(item) {
  // Check if user already owns this game using API
  fetch('/api/user_purchases', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  })
  .then(response => response.json())
  .then(purchases => {
    const ownsGame = purchases.some(purchase => purchase.game_id === item.id);
    if (ownsGame) {
      alert("You already own this game! Check your library.");
      return;
    }

    let cartItems = localStorage.getItem("items");

    if (cartItems) {
      cartItems = JSON.parse(cartItems);
    } else {
      cartItems = [];
    }

    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      item.quantity = 1;
      cartItems.push(item);
    }

    localStorage.setItem("items", JSON.stringify(cartItems));
    renderCart();
  })
  .catch(error => {
    console.error('Error checking purchases:', error);
    // Fallback to adding to cart anyway
    let cartItems = localStorage.getItem("items");

    if (cartItems) {
      cartItems = JSON.parse(cartItems);
    } else {
      cartItems = [];
    }

    const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      item.quantity = 1;
      cartItems.push(item);
    }

    localStorage.setItem("items", JSON.stringify(cartItems));
    renderCart();
  });
}

// Remove item from cart
function removeItemFromCart(itemIndex) {
  let cartItems = localStorage.getItem("items");

  if (cartItems) {
    cartItems = JSON.parse(cartItems);
    cartItems.splice(itemIndex, 1);
    localStorage.setItem("items", JSON.stringify(cartItems));

    // Refresh the cart display
    renderCart();
  }
}

// Increase item quantity in cart
function increaseItemQuantity(itemIndex) {
  let cartItems = localStorage.getItem("items");

  if (cartItems) {
    cartItems = JSON.parse(cartItems);
    cartItems[itemIndex].quantity++;
    localStorage.setItem("items", JSON.stringify(cartItems));

    // Refresh the cart display
    renderCart();
  }
}

// Decrease item quantity in cart
function decreaseItemQuantity(itemIndex) {
  let cartItems = localStorage.getItem("items");

  if (cartItems) {
    cartItems = JSON.parse(cartItems);

    if (cartItems[itemIndex].quantity > 1) {
      cartItems[itemIndex].quantity--;
    } else {
      cartItems.splice(itemIndex, 1);
    }

    localStorage.setItem("items", JSON.stringify(cartItems));

    // Refresh the cart display
    renderCart();
  }
}

// Empty the cart
function emptyCart() {
  localStorage.removeItem("items");

  // Refresh the cart display
  renderCart();
}

// Checkout
function checkout() {
  const total = calculateTotal();

  if (total === 0) alert("cart is empty");
  // Redirect to the payment page with the total price as a query parameter
  else window.location.href = "payment.html?total=" + total;
}

// Calculate the total price of items in the cart
function calculateTotal() {
  let total = 0;

  // Retrieve cart items from local storage
  let storedItems = localStorage.getItem("items");

  if (storedItems) {
    storedItems = JSON.parse(storedItems);

    storedItems.forEach((item) => {
      total += item.price * item.quantity;
    });
  }

  return total;
}

// Render the cart

function renderCart() {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalPrice = document.getElementById("total-price");
  const emptyCartBtn = document.getElementById("empty-cart-btn");
  const checkoutBtn = document.getElementById("checkout-btn");

  // Clear existing cart items
  cartItemsContainer.innerHTML = "";

  // Retrieve cart items from local storage
  let storedItems = localStorage.getItem("items");

  if (storedItems) {
    storedItems = JSON.parse(storedItems);

    let total = 0;

    storedItems.forEach((item, index) => {
      const cartItem = document.createElement("div");
      cartItem.className = "cart-item";

      const itemName = document.createElement("span");
      itemName.className = "cart-item-name";
      itemName.textContent = item.name;

      const itemQuantity = document.createElement("span");
      itemQuantity.className = "cart-item-quantity";
      itemQuantity.textContent = "x" + item.quantity;

      const itemControls = document.createElement("div");
      itemControls.className = "cart-item-controls";

      const increaseBtn = document.createElement("button");
      increaseBtn.className = "btn btn-sm btn-primary";
      increaseBtn.textContent = "+";
      increaseBtn.addEventListener("click", () => increaseItemQuantity(index));

      const decreaseBtn = document.createElement("button");
      decreaseBtn.className = "btn btn-sm btn-primary";
      decreaseBtn.textContent = "-";
      decreaseBtn.addEventListener("click", () => decreaseItemQuantity(index));

      const removeItemBtn = document.createElement("button");
      removeItemBtn.className = "btn btn-sm btn-danger remove-item-btn";
      removeItemBtn.textContent = "Remove";
      removeItemBtn.addEventListener("click", () => removeItemFromCart(index));

      itemControls.appendChild(increaseBtn);
      itemControls.appendChild(decreaseBtn);
      itemControls.appendChild(removeItemBtn);

      cartItem.appendChild(itemName);
      cartItem.appendChild(itemQuantity);
      cartItem.appendChild(itemControls);

      cartItemsContainer.appendChild(cartItem);

      total += item.price * item.quantity;
    });

    emptyCartBtn.style.display = "block";
    checkoutBtn.style.display = "block";
    totalPrice.textContent = "Total Price: ₱ " + total;
  } else {
    emptyCartBtn.style.display = "none";
    checkoutBtn.style.display = "none";
    totalPrice.textContent = "";
  }
}

// Initial setup
renderItems();
renderCart();

// Add event listener to empty cart button
const emptyCartBtn = document.getElementById("empty-cart-btn");
emptyCartBtn.addEventListener("click", emptyCart);

// Add event listener to checkout button
const checkoutBtn = document.getElementById("checkout-btn");
checkoutBtn.addEventListener("click", checkout);

// Add event listener to category select
const categorySelect = document.getElementById("category-select");
categorySelect.addEventListener("change", renderItems);

// Add event listener to sort select
const sortSelect = document.getElementById("sort-select");
sortSelect.addEventListener("change", renderItems);
